import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    const role = await this.rolesService.create(createRoleDto, user.organizationId);
    return {
      data: role,
      message: 'Role created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Returns list of all roles' })
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      data: roles,
      meta: {
        total: roles.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'ca4e1067-1fec-4113-bf2d-5139170e9edc' })
  @ApiResponse({ status: 200, description: 'Returns role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    return {
      data: role,
    };
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update role by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'ca4e1067-1fec-4113-bf2d-5139170e9edc' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      data: role,
      message: 'Role updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete role by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'ca4e1067-1fec-4113-bf2d-5139170e9edc' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Param('id') id: string) {
    const result = await this.rolesService.remove(id);
    return result;
  }

  @Post('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign role to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role assigned to user successfully' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    const result = await this.rolesService.assignRole(assignRoleDto);
    return {
      data: result,
      message: 'Role assigned to user successfully',
    };
  }

  @Delete(':roleId/users/:userId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove role from user (Admin only)' })
  @ApiParam({ name: 'roleId', description: 'Role UUID', example: 'ca4e1067-1fec-4113-bf2d-5139170e9edc' })
  @ApiParam({ name: 'userId', description: 'User UUID', example: 'e8aa6ce0-a390-4500-b8ca-ba9abcc18c47' })
  @ApiResponse({ status: 200, description: 'Role removed from user successfully' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ) {
    const result = await this.rolesService.removeRoleFromUser(userId, roleId);
    return result;
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users with a specific role' })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'ca4e1067-1fec-4113-bf2d-5139170e9edc' })
  @ApiResponse({ status: 200, description: 'Returns list of users with this role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getUsersByRole(@Param('id') id: string) {
    const users = await this.rolesService.getUsersByRole(id);
    return {
      data: users,
      meta: {
        total: users.length,
      },
    };
  }
}
