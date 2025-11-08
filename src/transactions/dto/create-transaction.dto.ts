import { IsString, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
