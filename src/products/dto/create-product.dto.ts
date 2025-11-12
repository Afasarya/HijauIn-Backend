import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}
