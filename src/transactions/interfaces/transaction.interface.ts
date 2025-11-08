import { $Enums } from '../../../generated/prisma/client';

export interface TransactionResponse {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  amount: number;
  amountFormatted: string;
  status: $Enums.TransactionStatus;
  payment_url: string | null;
  midtrans_order: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    image_url: string | null;
  };
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}
