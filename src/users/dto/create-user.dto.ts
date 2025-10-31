import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { UserRole } from '../../auth/enums/user-role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nama_panggilan: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  avatar_url?: string;
}
