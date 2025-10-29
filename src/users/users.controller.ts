import { 
  Controller, 
  Get, 
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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
