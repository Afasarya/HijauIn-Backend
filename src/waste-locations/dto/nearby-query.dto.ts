import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { WasteCategory } from '../../../generated/prisma/client';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  radius?: number = 1000; // Default 1000 meters

  @IsEnum(WasteCategory)
  @IsOptional()
  category?: WasteCategory;
}
