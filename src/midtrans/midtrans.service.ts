import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { midtransConfig } from './midtrans.config';
import * as crypto from 'crypto';

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  email: string;
}

export interface MidtransSnapRequest {
  transaction_details: MidtransTransactionDetails;
  item_details: MidtransItemDetails[];
  customer_details: MidtransCustomerDetails;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey: string;
  private readonly snapUrl: string;

  constructor() {
    if (!midtransConfig.serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY is not defined in environment variables');
    }
    this.serverKey = midtransConfig.serverKey;
    this.snapUrl = midtransConfig.snapUrl;
  }

  /**
   * Create Snap transaction token for payment
   */
  async createSnapToken(request: MidtransSnapRequest): Promise<MidtransSnapResponse> {
    try {
      const authHeader = 'Basic ' + Buffer.from(this.serverKey + ':').toString('base64');

      const response = await fetch(this.snapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Midtrans API Error:', errorData);
        throw new BadRequestException(
          `Failed to create payment: ${errorData.error_messages?.join(', ') || 'Unknown error'}`,
        );
      }

      const data = await response.json();
      
      return {
        token: data.token,
        redirect_url: data.redirect_url,
      };
    } catch (error) {
      this.logger.error('Error creating Snap token:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Midtrans
   */
  verifySignature(orderId: string, statusCode: string, grossAmount: string, signature: string): boolean {
    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Parse transaction status from Midtrans notification
   */
  parseTransactionStatus(transactionStatus: string, fraudStatus: string): 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED' {
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        return 'PAID';
      }
      return 'PENDING';
    } else if (transactionStatus === 'settlement') {
      return 'PAID';
    } else if (transactionStatus === 'pending') {
      return 'PENDING';
    } else if (transactionStatus === 'deny' || transactionStatus === 'expire' || transactionStatus === 'cancel') {
      return 'FAILED';
    }
    
    return 'PENDING';
  }
}
