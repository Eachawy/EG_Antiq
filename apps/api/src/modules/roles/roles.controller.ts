import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
@UseGuards(RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      data: role,
      message: 'Role created successfully',
    };
  }

  @Get()
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
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    return {
      data: role,
    };
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      data: role,
      message: 'Role updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const result = await this.rolesService.remove(id);
    return result;
  }

  @Post('assign')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    const result = await this.rolesService.assignRole(assignRoleDto);
    return {
      data: result,
      message: 'Role assigned to user successfully',
    };
  }

  @Delete(':roleId/users/:userId')
  @Roles('admin')
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string
  ) {
    const result = await this.rolesService.removeRoleFromUser(userId, roleId);
    return result;
  }

  @Get(':id/users')
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
