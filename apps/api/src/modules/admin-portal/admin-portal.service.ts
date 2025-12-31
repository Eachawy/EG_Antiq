import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { FavoritesService } from '../favorites/favorites.service';
import { BrowsingHistoryService } from '../browsing-history/browsing-history.service';
import { SavedSearchesService } from '../saved-searches/saved-searches.service';
import { PortalSettingsService } from '../portal-settings/portal-settings.service';
import { logger } from '../../logger';
import { PaginationDto } from '../favorites/dto/pagination.dto';

@Injectable()
export class AdminPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly favoritesService: FavoritesService,
    private readonly browsingHistoryService: BrowsingHistoryService,
    private readonly savedSearchesService: SavedSearchesService,
    private readonly portalSettingsService: PortalSettingsService,
  ) {}

  /**
   * Get all portal users with pagination and filters
   */
  async getAllPortalUsers(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.portalUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              favorites: true,
              browsingHistory: true,
              savedSearches: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.portalUser.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single portal user details
   */
  async getPortalUserById(portalUserId: string) {
    const user = await this.prisma.portalUser.findUnique({
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
        _count: {
          select: {
            favorites: true,
            browsingHistory: true,
            savedSearches: true,
            oauthProviders: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('PORTAL_USER_NOT_FOUND', 'Portal user not found', 404);
    }

    return user;
  }

  /**
   * Get portal user's favorites (delegated to FavoritesService)
   */
  async getPortalUserFavorites(portalUserId: string, paginationDto: PaginationDto) {
    await this.verifyPortalUserExists(portalUserId);
    return this.favoritesService.getFavorites(portalUserId, paginationDto);
  }

  /**
   * Delete a specific favorite for a portal user
   */
  async deletePortalUserFavorite(portalUserId: string, favoriteId: string, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);

    const favorite = await this.prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite) {
      throw new AppError('FAVORITE_NOT_FOUND', 'Favorite not found', 404);
    }

    if (favorite.portalUserId !== portalUserId) {
      throw new AppError('FAVORITE_MISMATCH', 'Favorite does not belong to this user', 403);
    }

    await this.prisma.favorite.delete({
      where: { id: favoriteId },
    });

    logger.info('Admin deleted portal user favorite', {
      adminUserId,
      portalUserId,
      favoriteId,
    });
  }

  /**
   * Clear all favorites for a portal user
   */
  async clearPortalUserFavorites(portalUserId: string, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);

    const result = await this.prisma.favorite.deleteMany({
      where: { portalUserId },
    });

    logger.info('Admin cleared all portal user favorites', {
      adminUserId,
      portalUserId,
      count: result.count,
    });

    return { deletedCount: result.count };
  }

  /**
   * Get portal user's browsing history
   */
  async getPortalUserHistory(portalUserId: string, paginationDto: PaginationDto) {
    await this.verifyPortalUserExists(portalUserId);
    return this.browsingHistoryService.getHistory(portalUserId, paginationDto);
  }

  /**
   * Clear portal user's browsing history
   */
  async clearPortalUserHistory(portalUserId: string, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);
    const result = await this.browsingHistoryService.clearHistory(portalUserId);

    logger.info('Admin cleared portal user browsing history', {
      adminUserId,
      portalUserId,
      count: result.deletedCount,
    });

    return result;
  }

  /**
   * Get portal user's saved searches
   */
  async getPortalUserSavedSearches(portalUserId: string) {
    await this.verifyPortalUserExists(portalUserId);
    return this.savedSearchesService.getSavedSearches(portalUserId);
  }

  /**
   * Delete a specific saved search for a portal user
   */
  async deletePortalUserSavedSearch(
    portalUserId: string,
    savedSearchId: string,
    adminUserId: string,
  ) {
    await this.verifyPortalUserExists(portalUserId);

    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
    });

    if (!savedSearch) {
      throw new AppError('SAVED_SEARCH_NOT_FOUND', 'Saved search not found', 404);
    }

    if (savedSearch.portalUserId !== portalUserId) {
      throw new AppError('SAVED_SEARCH_MISMATCH', 'Saved search does not belong to this user', 403);
    }

    await this.prisma.savedSearch.delete({
      where: { id: savedSearchId },
    });

    logger.info('Admin deleted portal user saved search', {
      adminUserId,
      portalUserId,
      savedSearchId,
    });
  }

  /**
   * Get portal user's settings
   */
  async getPortalUserSettings(portalUserId: string) {
    await this.verifyPortalUserExists(portalUserId);
    return this.portalSettingsService.getSettings(portalUserId);
  }

  /**
   * Update portal user's settings
   */
  async updatePortalUserSettings(portalUserId: string, updateDto: any, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);
    const settings = await this.portalSettingsService.updateSettings(portalUserId, updateDto);

    logger.info('Admin updated portal user settings', {
      adminUserId,
      portalUserId,
    });

    return settings;
  }

  /**
   * Update portal user status (activate/suspend/deactivate)
   */
  async updatePortalUserStatus(
    portalUserId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    adminUserId: string,
  ) {
    await this.verifyPortalUserExists(portalUserId);

    const user = await this.prisma.portalUser.update({
      where: { id: portalUserId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    logger.info('Admin updated portal user status', {
      adminUserId,
      portalUserId,
      newStatus: status,
    });

    return user;
  }

  /**
   * Delete portal user account (soft delete)
   */
  async deletePortalUser(portalUserId: string, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);

    await this.prisma.portalUser.update({
      where: { id: portalUserId },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    // Revoke all refresh tokens
    await this.prisma.portalRefreshToken.updateMany({
      where: { portalUserId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info('Admin deleted portal user account', {
      adminUserId,
      portalUserId,
    });
  }

  /**
   * Get comprehensive portal user statistics
   */
  async getPortalUserStats(portalUserId: string) {
    await this.verifyPortalUserExists(portalUserId);

    const [
      user,
      favoritesCount,
      browsingHistoryCount,
      savedSearchesCount,
      oauthProviders,
      recentHistory,
    ] = await Promise.all([
      this.prisma.portalUser.findUnique({
        where: { id: portalUserId },
        select: { createdAt: true, lastLoginAt: true },
      }),
      this.prisma.favorite.count({ where: { portalUserId } }),
      this.prisma.browsingHistory.count({ where: { portalUserId } }),
      this.prisma.savedSearch.count({ where: { portalUserId } }),
      this.prisma.oAuthProvider.findMany({
        where: { portalUserId },
        select: { provider: true, createdAt: true },
      }),
      this.prisma.browsingHistory.findMany({
        where: { portalUserId },
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: {
          monument: {
            select: {
              monumentNameEn: true,
              monumentNameAr: true,
            },
          },
        },
      }),
    ]);

    return {
      favoritesCount,
      browsingHistoryCount,
      savedSearchesCount,
      oauthProviders,
      memberSince: user?.createdAt,
      lastLogin: user?.lastLoginAt,
      recentActivity: recentHistory,
    };
  }

  /**
   * Helper: Verify portal user exists
   */
  private async verifyPortalUserExists(portalUserId: string) {
    const user = await this.prisma.portalUser.findUnique({
      where: { id: portalUserId, deletedAt: null },
    });

    if (!user) {
      throw new AppError('PORTAL_USER_NOT_FOUND', 'Portal user not found', 404);
    }

    return user;
  }
}
