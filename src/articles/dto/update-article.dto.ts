import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
