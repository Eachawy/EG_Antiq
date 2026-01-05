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
          location: true,
          bio: true,
          avatar: true,
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
   * Get all favorites across all portal users (Admin view)
   */
  async getAllFavorites(filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          portalUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          monument: {
            select: {
              id: true,
              monumentNameEn: true,
              monumentNameAr: true,
            },
          },
        },
      }),
      this.prisma.favorite.count(),
    ]);

    return {
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a favorite for a portal user (Admin action)
   */
  async createFavoriteForUser(portalUserId: string, monumentId: number, notes: string | undefined, adminUserId: string) {
    // Verify portal user exists
    await this.verifyPortalUserExists(portalUserId);

    // Verify monument exists
    const monument = await this.prisma.monument.findUnique({
      where: { id: monumentId },
    });

    if (!monument) {
      throw new AppError('MONUMENT_NOT_FOUND', 'Monument not found', 404);
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findFirst({
      where: {
        portalUserId,
        monumentId,
      },
    });

    if (existing) {
      throw new AppError('ALREADY_FAVORITED', 'Monument already in favorites', 409);
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        portalUserId,
        monumentId,
        notes: notes || null,
      },
      include: {
        portalUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        monument: {
          select: {
            id: true,
            monumentNameEn: true,
            monumentNameAr: true,
          },
        },
      },
    });

    logger.info('Admin created favorite for portal user', {
      adminUserId,
      portalUserId,
      monumentId,
      favoriteId: favorite.id,
    });

    return favorite;
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
   * Get all browsing history across all portal users (Admin view)
   */
  async getAllBrowsingHistory(filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.prisma.browsingHistory.findMany({
        skip,
        take: limit,
        orderBy: { visitedAt: 'desc' },
        include: {
          portalUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          monument: {
            select: {
              id: true,
              monumentNameEn: true,
              monumentNameAr: true,
            },
          },
        },
      }),
      this.prisma.browsingHistory.count(),
    ]);

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
   * Get all saved searches across all portal users (Admin view)
   */
  async getAllSavedSearches(filters: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [savedSearches, total] = await Promise.all([
      this.prisma.savedSearch.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          portalUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.savedSearch.count(),
    ]);

    return {
      data: savedSearches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a saved search for a portal user (Admin action)
   */
  async createSavedSearchForUser(portalUserId: string, searchData: any, adminUserId: string) {
    // Verify portal user exists
    await this.verifyPortalUserExists(portalUserId);

    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        portalUserId,
        name: searchData.name,
        keyword: searchData.keyword || null,
        eraIds: searchData.eraIds || [],
        dynastyIds: searchData.dynastyIds || [],
        monumentTypeIds: searchData.monumentTypeIds || [],
        dateFrom: searchData.dateFrom || null,
        dateTo: searchData.dateTo || null,
        filters: searchData.filters || {},
        resultCount: searchData.resultCount || 0,
      },
      include: {
        portalUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    logger.info('Admin created saved search for portal user', {
      adminUserId,
      portalUserId,
      savedSearchId: savedSearch.id,
    });

    return savedSearch;
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
   * Create new portal user
   */
  async createPortalUser(createDto: any, adminUserId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.portalUser.findUnique({
      where: {
        email: createDto.email,
      },
    });

    if (existingUser) {
      if (existingUser.deletedAt === null) {
        // User exists and is active
        throw new AppError('EMAIL_EXISTS', 'Email already in use', 409);
      } else {
        // User was soft-deleted - inform admin
        throw new AppError(
          'PORTAL_USER_DELETED',
          'A portal user with this email was previously deleted. Please contact support to restore the account.',
          409,
        );
      }
    }

    // Create new portal user without password (admin-created users will set password later or use OAuth)
    const user = await this.prisma.portalUser.create({
      data: {
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone || null,
        location: createDto.location || null,
        bio: createDto.bio || null,
        avatar: createDto.avatar || null,
        status: createDto.status || 'ACTIVE',
        emailVerified: false,
        passwordHash: null, // Admin-created users have no password initially
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

    logger.info('Admin created portal user', {
      adminUserId,
      portalUserId: user.id,
    });

    return user;
  }

  /**
   * Update portal user details
   */
  async updatePortalUser(portalUserId: string, updateDto: any, adminUserId: string) {
    await this.verifyPortalUserExists(portalUserId);

    // Check if email is being updated and ensure it's unique
    if (updateDto.email) {
      const existingUser = await this.prisma.portalUser.findFirst({
        where: {
          email: updateDto.email,
          id: { not: portalUserId },
        },
      });

      if (existingUser) {
        if (existingUser.deletedAt === null) {
          // Email is in use by another active user
          throw new AppError('EMAIL_EXISTS', 'Email already in use by another user', 409);
        } else {
          // Email belongs to a soft-deleted user
          throw new AppError(
            'EMAIL_DELETED_USER',
            'This email belongs to a deleted user account. Please contact support.',
            409,
          );
        }
      }
    }

    // Build update data object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updateDto.email) updateData.email = updateDto.email;
    if (updateDto.firstName) updateData.firstName = updateDto.firstName;
    if (updateDto.lastName) updateData.lastName = updateDto.lastName;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.location !== undefined) updateData.location = updateDto.location;
    if (updateDto.bio !== undefined) updateData.bio = updateDto.bio;
    if (updateDto.avatar !== undefined) updateData.avatar = updateDto.avatar;
    if (updateDto.status) updateData.status = updateDto.status;

    const user = await this.prisma.portalUser.update({
      where: { id: portalUserId },
      data: updateData,
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

    logger.info('Admin updated portal user', {
      adminUserId,
      portalUserId,
    });

    return user;
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
