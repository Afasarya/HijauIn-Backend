import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, CheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * NEW: Checkout from cart with shipping details
   * Main endpoint for marketplace flow
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@GetUser('id') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.transactionsService.checkoutFromCart(userId, checkoutDto);
  }

  /**
   * Get user's transactions
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  getUserTransactions(@GetUser('id') userId: string) {
    return this.transactionsService.getUserTransactions(userId);
  }

  /**
   * Get transaction detail
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getTransactionDetail(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.getTransactionDetail(id, userId);
  }

  /**
   * Check payment status manually
   */
  @Get(':id/check-status')
  @UseGuards(JwtAuthGuard)
  checkPaymentStatus(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.checkPaymentStatus(id, userId);
  }

  /**
   * Admin: Get all transactions
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  /**
   * Admin: Update transaction status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateTransactionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.transactionsService.updateTransactionStatus(id, status);
  }

  /**
   * Midtrans webhook
   */
  @Post('webhook/midtrans')
  @HttpCode(HttpStatus.OK)
  async handleMidtransWebhook(@Body() notification: any) {
    await this.transactionsService.handleMidtransNotification(notification);
    return { message: 'Notification processed' };
  }
}
