import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { logger } from '../../logger';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new role
   */
  async create(createRoleDto: CreateRoleDto) {
    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new AppError('ROLE_EXISTS', 'Role with this name already exists', 409);
    }

    const role = await this.prisma.role.create({
      data: createRoleDto,
    });

    logger.info('Role created', { roleId: role.id, name: role.name });

    return role;
  }

  /**
   * Get all roles
   */
  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single role by ID
   */
  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new AppError('ROLE_NOT_FOUND', 'Role not found', 404);
    }

    return role;
  }

  /**
   * Update a role
   */
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);

    // Check if new name conflicts with existing role
    if (updateRoleDto.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError('ROLE_EXISTS', 'Role with this name already exists', 409);
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    logger.info('Role updated', { roleId: role.id, name: role.name });

    return role;
  }

  /**
   * Delete a role
   */
  async remove(id: string) {
    await this.findOne(id);

    // Check if role is assigned to any users
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new AppError(
        'ROLE_IN_USE',
        `Cannot delete role. It is assigned to ${userCount} user(s)`,
        409
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    logger.info('Role deleted', { roleId: id });

    return { message: 'Role deleted successfully' };
  }

  /**
   * Assign a role to a user
   */
  async assignRole(assignRoleDto: AssignRoleDto) {
    const { userId, roleId } = assignRoleDto;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new AppError('ROLE_NOT_FOUND', 'Role not found', 404);
    }

    // Check if already assigned
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });

    if (existing) {
      throw new AppError('ROLE_ALREADY_ASSIGNED', 'Role is already assigned to this user', 409);
    }

    // Assign role
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info('Role assigned to user', { userId, roleId });

    return userRole;
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });

    if (!userRole) {
      throw new AppError('ROLE_NOT_ASSIGNED', 'Role is not assigned to this user', 404);
    }

    await this.prisma.userRole.delete({
      where: {
        id: userRole.id,
      },
    });

    logger.info('Role removed from user', { userId, roleId });

    return { message: 'Role removed from user successfully' };
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(roleId: string) {
    await this.findOne(roleId);

    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    return userRoles.map((ur) => ({
      ...ur.user,
      assignedAt: ur.assignedAt,
    }));
  }
}
