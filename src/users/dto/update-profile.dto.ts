import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nama_panggilan?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;
}
