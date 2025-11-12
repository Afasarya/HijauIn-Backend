import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 6)
  postalCode: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
