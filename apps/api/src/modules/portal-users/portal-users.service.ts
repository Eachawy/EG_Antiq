import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { logger } from '../../logger';

@Injectable()
export class PortalUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        bio: true,
        avatar: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return portalUser;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const updatedUser = await this.prisma.portalUser.update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        bio: true,
        avatar: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('Portal user profile updated', { userId });

    return updatedUser;
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string) {
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    await this.prisma.portalUser.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    // Revoke all refresh tokens
    await this.prisma.portalRefreshToken.updateMany({
      where: { portalUserId: userId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info('Portal user account deleted', { userId });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Get counts for user's activities
    const [favoritesCount, browsingHistoryCount, savedSearchesCount] = await Promise.all([
      this.prisma.favorite.count({ where: { portalUserId: userId } }),
      this.prisma.browsingHistory.count({ where: { portalUserId: userId } }),
      this.prisma.savedSearch.count({ where: { portalUserId: userId } }),
    ]);

    return {
      favoritesCount,
      browsingHistoryCount,
      savedSearchesCount,
      memberSince: portalUser.createdAt,
      lastLogin: portalUser.lastLoginAt,
    };
  }
}
