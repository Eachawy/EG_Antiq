import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { logger } from '../../logger';

@Injectable()
export class PortalSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user settings
   */
  async getSettings(portalUserId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { portalUserId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          id: crypto.randomUUID(),
          portalUserId,
        },
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateSettings(portalUserId: string, updateSettingsDto: UpdateSettingsDto) {
    // Ensure settings exist
    await this.getSettings(portalUserId);

    const updatedSettings = await this.prisma.userSettings.update({
      where: { portalUserId },
      data: {
        ...updateSettingsDto,
        updatedAt: new Date(),
      },
    });

    logger.info('Portal user settings updated', { portalUserId });

    return updatedSettings;
  }

  /**
   * Change password
   */
  async changePassword(portalUserId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: portalUserId, deletedAt: null },
    });

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Check if user has a password (might be OAuth only)
    if (!portalUser.passwordHash) {
      throw new AppError(
        'NO_PASSWORD',
        'This account uses social login. Password cannot be changed.',
        400,
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, portalUser.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.portalUser.update({
      where: { id: portalUserId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Revoke all existing refresh tokens for security
    await this.prisma.portalRefreshToken.updateMany({
      where: { portalUserId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info('Portal user password changed', { portalUserId });
  }

  /**
   * Download user data (GDPR compliance)
   */
  async downloadUserData(portalUserId: string) {
    const [portalUser, settings, favorites, browsingHistory, savedSearches] = await Promise.all([
      this.prisma.portalUser.findUnique({
        where: { id: portalUserId, deletedAt: null },
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
          lastLoginAt: true,
        },
      }),
      this.prisma.userSettings.findUnique({
        where: { portalUserId },
      }),
      this.prisma.favorite.findMany({
        where: { portalUserId },
        include: { monument: true },
      }),
      this.prisma.browsingHistory.findMany({
        where: { portalUserId },
        include: { monument: true },
      }),
      this.prisma.savedSearch.findMany({
        where: { portalUserId },
      }),
    ]);

    if (!portalUser) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    logger.info('Portal user data downloaded', { portalUserId });

    return {
      user: portalUser,
      settings,
      favorites,
      browsingHistory,
      savedSearches,
      exportedAt: new Date(),
    };
  }
}
