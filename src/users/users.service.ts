import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/enums/user-role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // User Profile Management
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // Admin User Management
  async createUser(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        nama_panggilan: createUserDto.nama_panggilan,
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role || UserRole.USER,
        avatar_url: createUserDto.avatar_url,
      },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if username is being changed and already exists
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateRole(id: string, role: UserRole, requesterId: string) {
    // Prevent user from changing their own role
    if (id === requesterId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User role updated successfully',
      user: updatedUser,
    };
  }

  async createAdmin(email: string, username: string, password: string, nama_panggilan: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nama_panggilan,
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        nama_panggilan: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
        createdAt: true,
      },
    });

    return admin;
  }

  async deleteUser(id: string, requesterId: string) {
    // Prevent user from deleting themselves
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
    };
  }

  async getUserStats() {
    const totalUsers = await this.prisma.user.count();
    
    const totalAdmins = await this.prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    // Get users registered this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalUsersRegisteredThisMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return {
      totalUsers,
      totalAdmins,
      totalUsersRegisteredThisMonth,
    };
  }
}
