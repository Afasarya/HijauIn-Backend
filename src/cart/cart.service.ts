import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or Create user cart
   */
  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Create cart if not exists
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    return this.formatCartResponse(cart);
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Validate product exists and stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if product already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, Current in cart: ${existingItem.quantity}, Requested: ${quantity}`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getOrCreateCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, cartItemId: string, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found`);
    }

    // Verify cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new BadRequestException('This cart item does not belong to you');
    }

    // Validate stock
    if (cartItem.product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${cartItem.product.stock}, Requested: ${quantity}`,
      );
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(userId: string, cartItemId: string) {
    // Find cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found`);
    }

    // Verify cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new BadRequestException('This cart item does not belong to you');
    }

    // Delete cart item
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return {
      message: 'Item removed from cart successfully',
    };
  }

  /**
   * Clear all items in cart
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      message: 'Cart cleared successfully',
    };
  }

  /**
   * Format cart response
   */
  private formatCartResponse(cart: any) {
    const items = cart.items.map((item: any) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        stock: item.product.stock,
        image_url: item.product.image_url,
        category: item.product.category,
      },
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    return {
      message: 'Cart retrieved successfully',
      data: {
        id: cart.id,
        userId: cart.userId,
        items,
        summary: {
          totalItems,
          totalAmount,
          totalAmountFormatted: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
          }).format(totalAmount),
        },
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    };
  }
}
