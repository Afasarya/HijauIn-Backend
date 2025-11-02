import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsArray, IsUrl } from 'class-validator';
import { WasteCategory } from '../../../generated/prisma/client';

export class UpdateWasteLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

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

  @IsArray()
  @IsOptional()
  @IsEnum(WasteCategory, { each: true })
  categories?: WasteCategory[];

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
