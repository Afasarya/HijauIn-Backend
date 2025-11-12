import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../midtrans/midtrans.service';
import { CheckoutDto } from './dto';
import { formatToRupiah } from '../utils/currency-formatter';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
  ) {}

  /**
   * Checkout from cart with shipping details
   */
  async checkoutFromCart(userId: string, checkoutDto: CheckoutDto) {
    // Get user cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${userId.substring(0, 8).toUpperCase()}`;
    const midtransOrderId = `MIDTRANS-${Date.now()}`;

    // Create transaction with items and shipping detail in a transaction
    const transaction = await this.prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          orderNumber,
          totalAmount,
          status: 'PENDING',
          midtransOrderId,
        },
      });

      // Create transaction items
      const transactionItems = await Promise.all(
        cart.items.map((item) =>
          tx.transactionItem.create({
            data: {
              transactionId: newTransaction.id,
              productId: item.product.id,
              productName: item.product.name,
              productPrice: item.product.price,
              quantity: item.quantity,
              subtotal: item.product.price * item.quantity,
            },
          }),
        ),
      );

      // Create shipping detail
      const shippingDetail = await tx.shippingDetail.create({
        data: {
          transactionId: newTransaction.id,
          recipientName: checkoutDto.recipientName,
          phoneNumber: checkoutDto.phoneNumber,
          address: checkoutDto.address,
          city: checkoutDto.city,
          province: checkoutDto.province,
          postalCode: checkoutDto.postalCode,
          notes: checkoutDto.notes,
        },
      });

      return {
        ...newTransaction,
        items: transactionItems,
        shippingDetail,
      };
    });

    // Prepare items for Midtrans
    const itemDetails = cart.items.map((item) => ({
      id: item.product.id,
      price: item.product.price,
      quantity: item.quantity,
      name: item.product.name,
    }));

    // Create Midtrans Snap payment
    try {
      const snapResponse = await this.midtransService.createSnapToken({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: totalAmount,
        },
        item_details: itemDetails,
        customer_details: {
          first_name: user.nama_panggilan,
          email: user.email,
        },
      });

      // Update transaction with payment URL
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { paymentUrl: snapResponse.redirect_url },
        include: {
          items: true,
          shippingDetail: true,
        },
      });

      // Clear cart after successful checkout
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        message: 'Checkout successful',
        data: {
          ...updatedTransaction,
          totalAmountFormatted: formatToRupiah(updatedTransaction.totalAmount),
        },
      };
    } catch (error) {
      // If Midtrans fails, mark transaction as failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException('Failed to create payment. Please try again.');
    }
  }

  /**
   * Get user transactions with details
   */
  async getUserTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: {
        items: true,
        shippingDetail: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Transactions retrieved successfully',
      data: transactions.map((transaction) => ({
        ...transaction,
        totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        items: transaction.items.map((item) => ({
          ...item,
          productPriceFormatted: formatToRupiah(item.productPrice),
          subtotalFormatted: formatToRupiah(item.subtotal),
        })),
      })),
    };
  }

  /**
   * Get transaction detail
   */
  async getTransactionDetail(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        items: true,
        shippingDetail: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      message: 'Transaction detail retrieved successfully',
      data: {
        ...transaction,
        totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        items: transaction.items.map((item) => ({
          ...item,
          productPriceFormatted: formatToRupiah(item.productPrice),
          subtotalFormatted: formatToRupiah(item.subtotal),
        })),
      },
    };
  }

  /**
   * Check payment status (for user to check manually)
   */
  async checkPaymentStatus(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        items: true,
        shippingDetail: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.midtransOrderId) {
      throw new BadRequestException('Transaction does not have a Midtrans order ID');
    }

    // If already paid, return current status
    if (transaction.status === 'PAID') {
      return {
        message: 'Transaction already paid',
        data: {
          ...transaction,
          totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        },
      };
    }

    try {
      // Check status from Midtrans
      const midtransStatus = await this.midtransService.getTransactionStatus(transaction.midtransOrderId);
      
      const newStatus = this.midtransService.parseTransactionStatus(
        midtransStatus.transaction_status,
        midtransStatus.fraud_status,
      );

      // Update status if changed
      if (transaction.status !== newStatus) {
        const updatedTransaction = await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: newStatus,
            updatedAt: new Date(),
          },
          include: {
            items: true,
            shippingDetail: true,
          },
        });

        // Reduce stock if just paid (status changed from non-PAID to PAID)
        const wasPending = ['PENDING', 'FAILED', 'CANCELLED'].includes(transaction.status);
        if (newStatus === 'PAID' && wasPending) {
          for (const item of transaction.items) {
            await this.prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        return {
          message: 'Payment status updated',
          data: {
            ...updatedTransaction,
            totalAmountFormatted: formatToRupiah(updatedTransaction.totalAmount),
          },
        };
      }

      return {
        message: 'Payment status checked',
        data: {
          ...transaction,
          totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        },
      };
    } catch (error) {
      return {
        message: 'Payment status checked',
        data: {
          ...transaction,
          totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        },
      };
    }
  }

  /**
   * Get all transactions (Admin only)
   */
  async getAllTransactions() {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        items: true,
        shippingDetail: true,
        user: {
          select: {
            id: true,
            email: true,
            nama_panggilan: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'All transactions retrieved successfully',
      data: transactions.map((transaction) => ({
        ...transaction,
        totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        items: transaction.items.map((item) => ({
          ...item,
          productPriceFormatted: formatToRupiah(item.productPrice),
          subtotalFormatted: formatToRupiah(item.subtotal),
        })),
      })),
    };
  }

  /**
   * Update transaction status (Admin only)
   */
  async updateTransactionStatus(transactionId: string, status: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: status as any,
        updatedAt: new Date(),
      },
      include: {
        items: true,
        shippingDetail: true,
      },
    });

    return {
      message: 'Transaction status updated successfully',
      data: {
        ...updatedTransaction,
        totalAmountFormatted: formatToRupiah(updatedTransaction.totalAmount),
      },
    };
  }

  /**
   * Delete transaction (Admin only)
   * Menghapus transaksi beserta transaction items dan shipping detail
   * HANYA untuk transaksi dengan status PENDING, FAILED, atau CANCELLED
   */
  async deleteTransaction(transactionId: string) {
    // Cek apakah transaksi ada
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: true,
        shippingDetail: true,
        user: {
          select: {
            nama_panggilan: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Validasi: hanya transaksi tertentu yang boleh dihapus
    const deletableStatuses = ['PENDING', 'FAILED', 'CANCELLED'];
    if (!deletableStatuses.includes(transaction.status)) {
      throw new BadRequestException(
        `Cannot delete transaction with status ${transaction.status}. Only PENDING, FAILED, or CANCELLED transactions can be deleted.`
      );
    }

    // Delete transaction (cascade akan otomatis hapus items dan shipping detail)
    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });

    console.log('🗑️ Transaction deleted:', {
      id: transactionId,
      orderNumber: transaction.orderNumber,
      user: transaction.user.email,
      status: transaction.status,
      totalAmount: transaction.totalAmount,
    });

    return {
      message: 'Transaction deleted successfully',
      data: {
        id: transaction.id,
        orderNumber: transaction.orderNumber,
        status: transaction.status,
        totalAmount: transaction.totalAmount,
        totalAmountFormatted: formatToRupiah(transaction.totalAmount),
        user: transaction.user,
        deletedAt: new Date(),
      },
    };
  }

  /**
   * Handle Midtrans webhook notification
   */
  async handleMidtransNotification(notification: any): Promise<void> {
    const { order_id, transaction_status, fraud_status, signature_key, status_code, gross_amount } = notification;

    console.log('🔔 ============ MIDTRANS WEBHOOK RECEIVED ============');
    console.log('🆔 Order ID:', order_id);
    console.log('📊 Transaction Status:', transaction_status);
    console.log('🔒 Fraud Status:', fraud_status);

    // Verify signature in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      const isValid = this.midtransService.verifySignature(
        order_id,
        status_code,
        gross_amount,
        signature_key,
      );

      if (!isValid) {
        console.error('❌ INVALID SIGNATURE!');
        throw new BadRequestException('Invalid signature');
      }
    }

    // Find transaction by midtransOrderId
    const transaction = await this.prisma.transaction.findUnique({
      where: { midtransOrderId: order_id },
      include: { 
        items: true,
      },
    });

    if (!transaction) {
      console.error('❌ Transaction NOT FOUND');
      throw new NotFoundException(`Transaction with order ID ${order_id} not found`);
    }

    // Parse status dari Midtrans
    const newStatus = this.midtransService.parseTransactionStatus(transaction_status, fraud_status);

    // Check if status actually changed
    if (transaction.status === newStatus) {
      console.log('⚠️  Status unchanged');
      return;
    }

    console.log('🔄 Updating transaction status from', transaction.status, 'to', newStatus);

    // Update transaction status
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // If paid and not already paid before, reduce stock
    const wasPending = ['PENDING', 'FAILED', 'CANCELLED'].includes(transaction.status);
    if (newStatus === 'PAID' && wasPending) {
      console.log('📦 Payment confirmed! Reducing product stock...');

      for (const item of transaction.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      console.log('✅ All product stocks reduced successfully!');
    }

    console.log('✅ ============ WEBHOOK PROCESSED SUCCESSFULLY ============\n');
  }
}
