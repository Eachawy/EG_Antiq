import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { logger } from '../../logger';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users (with multi-tenant filtering)
   */
  async getAllUsers(organizationId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  isSystem: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users;
    } catch (error) {
      logger.error('Error getting users', { error, organizationId });
      throw new AppError('FETCH_FAILED', 'Failed to fetch users', 500);
    }
  }

  /**
   * Get user by ID (with multi-tenant filtering)
   */
  async getUserById(id: string, organizationId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  isSystem: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting user by ID', { error, id, organizationId });
      throw new AppError('FETCH_FAILED', 'Failed to fetch user', 500);
    }
  }

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto, createdByUserId: string, currentUserOrgId: string) {
    const { email, password, firstName, lastName, status, organizationId } = createUserDto;

    try {
      // Use current user's organization if not specified
      const targetOrgId = organizationId || currentUserOrgId;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        if (existingUser.deletedAt === null) {
          // User exists and is active
          throw new AppError('USER_EXISTS', 'User with this email already exists', 409);
        } else {
          // User was soft-deleted - restore instead of creating new
          throw new AppError(
            'USER_DELETED',
            'A user with this email was previously deleted. Please contact support to restore the account.',
            409,
          );
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          status: (status as any) || 'ACTIVE',
          organizationId: targetOrgId,
          createdBy: createdByUserId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User created successfully', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating user', { error, email });
      throw new AppError('CREATE_FAILED', 'Failed to create user', 500);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto, updatedByUserId: string, organizationId: string) {
    const { email, firstName, lastName, status, password } = updateUserDto;

    try {
      // Check if user exists and belongs to organization
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
      });

      if (!existingUser) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      // If email is being updated, check for uniqueness
      if (email && email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email },
        });

        if (emailExists && emailExists.deletedAt === null) {
          throw new AppError('EMAIL_EXISTS', 'Email already in use', 409);
        }
      }

      // Prepare update data
      const updateData: any = {
        updatedBy: updatedByUserId,
        version: existingUser.version + 1,
      };

      if (email) updateData.email = email;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (status) updateData.status = status;

      // Hash new password if provided
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      // Update user
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          emailVerified: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User updated successfully', { userId: id });

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating user', { error, id });
      throw new AppError('UPDATE_FAILED', 'Failed to update user', 500);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, deletedByUserId: string, organizationId: string) {
    try {
      // Check if user exists and belongs to organization
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
          deletedAt: null,
        },
      });

      if (!existingUser) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      // Soft delete user
      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: deletedByUserId,
          version: existingUser.version + 1,
        },
      });

      logger.info('User deleted successfully', { userId: id });

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting user', { error, id });
      throw new AppError('DELETE_FAILED', 'Failed to delete user', 500);
    }
  }
}
