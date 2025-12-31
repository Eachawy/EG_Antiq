import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions({ resource: 'users', action: 'read' })
  @ApiOperation({ summary: 'Get all users in organization' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@CurrentUser() user: AuthenticatedUser) {
    const users = await this.usersService.getAllUsers(user.organizationId);
    return {
      data: users,
      meta: {
        total: users.length,
      },
      message: 'Users retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions({ resource: 'users', action: 'read' })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const userData = await this.usersService.getUserById(id, user.organizationId);
    return {
      data: userData,
      message: 'User retrieved successfully',
    };
  }

  @Post()
  @RequirePermissions({ resource: 'users', action: 'create' })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const newUser = await this.usersService.createUser(createUserDto, user.id, user.organizationId);
    return {
      data: newUser,
      message: 'User created successfully',
    };
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'users', action: 'update' })
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updatedUser = await this.usersService.updateUser(id, updateUserDto, user.id, user.organizationId);
    return {
      data: updatedUser,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'users', action: 'delete' })
  @ApiOperation({ summary: 'Delete user by ID (soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.usersService.deleteUser(id, user.id, user.organizationId);
    return result;
  }
}
