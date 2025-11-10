import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
