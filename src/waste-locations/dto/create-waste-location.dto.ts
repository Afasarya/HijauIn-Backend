import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { WasteCategory } from '../../../generated/prisma/client';

export class CreateWasteLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsEnum(WasteCategory)
  @IsNotEmpty()
  category: WasteCategory;
}
