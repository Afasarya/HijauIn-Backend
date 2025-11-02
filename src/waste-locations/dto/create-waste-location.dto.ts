import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min, Max, IsArray, IsUrl, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { WasteCategory } from '../../../generated/prisma/client';

export class CreateWasteLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

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

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category is required' })
  @IsEnum(WasteCategory, { each: true })
  categories: WasteCategory[];

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
