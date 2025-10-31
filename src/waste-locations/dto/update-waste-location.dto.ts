import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { WasteCategory } from '../../../generated/prisma/client';

export class UpdateWasteLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsEnum(WasteCategory)
  @IsOptional()
  category?: WasteCategory;
}
