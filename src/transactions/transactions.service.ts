import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService } from '../midtrans/midtrans.service';
import { CreateTransactionDto } from './dto';
import { TransactionResponse } from './interfaces';
import { formatToRupiah } from '../utils/currency-formatter';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionResponse> {
    const { productId, quantity } = createTransactionDto;

    // Get product
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check stock
    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Calculate amount
    const amount = product.price * quantity;

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${userId.substring(0, 8)}`;

    // Create transaction in database first
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        productId,
        quantity,
        amount,
        status: 'PENDING',
        midtrans_order: orderId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
          },
        },
      },
    });

    // Create Midtrans Snap payment
    try {
      const snapResponse = await this.midtransService.createSnapToken({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        item_details: [
          {
            id: product.id,
            price: product.price,
            quantity: quantity,
            name: product.name,
          },
        ],
        customer_details: {
          first_name: user.nama_panggilan,
          email: user.email,
        },
      });

      // Update transaction with payment URL
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { payment_url: snapResponse.redirect_url },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image_url: true,
            },
          },
        },
      });

      return {
        ...updatedTransaction,
        amountFormatted: formatToRupiah(updatedTransaction.amount),
        product: updatedTransaction.product ? {
          ...updatedTransaction.product,
          priceFormatted: formatToRupiah(updatedTransaction.product.price),
        } : undefined,
      };
    } catch (error) {
      // If Midtrans fails, mark transaction as failed
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  async findAll(userId: string): Promise<TransactionResponse[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      amountFormatted: formatToRupiah(transaction.amount),
      product: transaction.product ? {
        ...transaction.product,
        priceFormatted: formatToRupiah(transaction.product.price),
      } : undefined,
    }));
  }

  async findOne(id: string, userId: string): Promise<TransactionResponse> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { 
        id,
        userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      ...transaction,
      amountFormatted: formatToRupiah(transaction.amount),
      product: transaction.product ? {
        ...transaction.product,
        priceFormatted: formatToRupiah(transaction.product.price),
      } : undefined,
    };
  }

  async handleMidtransNotification(notification: any): Promise<void> {
    const { order_id, transaction_status, fraud_status, signature_key, status_code, gross_amount } = notification;

    console.log('🔔 Webhook received:', {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
    });

    // Verify signature (skip in development/testing)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      const isValid = this.midtransService.verifySignature(
        order_id,
        status_code,
        gross_amount,
        signature_key,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }
    } else {
      console.log('⚠️  Signature verification skipped (development mode)');
    }

    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { midtrans_order: order_id },
      include: { product: true },
    });

    if (!transaction) {
      console.error(`❌ Transaction not found: ${order_id}`);
      throw new NotFoundException(`Transaction with order ID ${order_id} not found`);
    }

    console.log('✅ Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: transaction_status,
    });

    // Parse status
    const status = this.midtransService.parseTransactionStatus(transaction_status, fraud_status);

    console.log('🔄 Updating transaction status to:', status);

    // Update transaction status
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status },
    });

    // If paid, reduce stock
    if (status === 'PAID' && transaction.status !== 'PAID') {
      console.log('📦 Reducing product stock...');
      await this.prisma.product.update({
        where: { id: transaction.productId },
        data: {
          stock: {
            decrement: transaction.quantity,
          },
        },
      });
      console.log('✅ Stock reduced successfully');
    }

    console.log('✅ Webhook processed successfully');
  }

  async getAllTransactions(): Promise<TransactionResponse[]> {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            nama_panggilan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      amountFormatted: formatToRupiah(transaction.amount),
      product: transaction.product ? {
        ...transaction.product,
        priceFormatted: formatToRupiah(transaction.product.price),
      } : undefined,
    })) as any;
  }
}
