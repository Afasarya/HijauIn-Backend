import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from './enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { nama_panggilan, username, email, password, confirmPassword } =
      registerDto;

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default role USER
    const user = await this.prisma.user.create({
      data: {
        nama_panggilan,
        username,
        email,
        password: hashedPassword,
        role: UserRole.USER, // Default role
      },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { emailOrUsername, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with role
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Login success',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nama_panggilan: user.nama_panggilan,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Validasi bahwa email terdaftar
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Hapus token lama user yang belum digunakan
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Generate token acak (UUID)
    const token = randomUUID();

    // Simpan token ke database dengan expires_at = now() + 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });

    // Kirim email via Resend API
    try {
      await this.mailService.sendPasswordResetEmail(email, token);
    } catch (error) {
      // Rollback: hapus token jika gagal kirim email
      await this.prisma.passwordResetToken.delete({
        where: { token },
      });
      throw new BadRequestException('Failed to send password reset email');
    }

    return {
      message: 'Password reset email sent successfully',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Validasi password dan confirmPassword cocok
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // Cari token di database
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Validasi token belum expired
    const now = new Date();
    if (resetToken.expiresAt < now) {
      throw new BadRequestException('Token has expired');
    }

    // Validasi token belum digunakan
    if (resetToken.used) {
      throw new BadRequestException('Token has already been used');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password di users table
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Tandai token sebagai used = true
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
