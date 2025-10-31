import { 
  Controller, 
  Get, 
  Post,
  Param, 
  Patch, 
  Delete,
  Body,
  UseGuards 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===== User Profile Management =====
  @Get('me')
  async getMyProfile(@GetUser('id') userId: string) {
    const user = await this.usersService.getProfile(userId);
    return {
      message: 'Profile retrieved successfully',
      user,
    };
  }

  @Patch('me')
  async updateMyProfile(
    @GetUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(userId, updateProfileDto);
    return {
      message: 'Profile updated successfully',
      user,
    };
  }

  // ===== Admin User Management =====
  @Roles(UserRole.ADMIN)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return {
      message: 'User created successfully',
      user,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get('stats')
  async getUserStats() {
    const stats = await this.usersService.getUserStats();
    return {
      message: 'User statistics retrieved successfully',
      stats,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully',
      user,
    };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser('id') requesterId: string,
  ) {
    return this.usersService.updateRole(id, updateRoleDto.role, requesterId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @GetUser('id') requesterId: string,
  ) {
    return this.usersService.deleteUser(id, requesterId);
  }
}
