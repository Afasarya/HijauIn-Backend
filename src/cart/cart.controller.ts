import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@GetUser('id') userId: string) {
    return this.cartService.getOrCreateCart(userId);
  }

  @Post('items')
  addToCart(@GetUser('id') userId: string, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Patch('items/:cartItemId')
  updateCartItem(
    @GetUser('id') userId: string,
    @Param('cartItemId') cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(userId, cartItemId, updateCartItemDto);
  }

  @Delete('items/:cartItemId')
  removeCartItem(@GetUser('id') userId: string, @Param('cartItemId') cartItemId: string) {
    return this.cartService.removeCartItem(userId, cartItemId);
  }

  @Delete()
  clearCart(@GetUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
