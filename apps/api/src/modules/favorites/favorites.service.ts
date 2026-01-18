import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { PaginationDto } from './dto/pagination.dto';
import { logger } from '../../logger';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all favorites for a user with optional pagination
   */
  async getFavorites(portalUserId: string, paginationDto: PaginationDto) {
    const { page = 1, limit } = paginationDto;

    try {
      // If limit is 0 or undefined, return all results without pagination
      const skipPagination = !limit || limit === 0;
      const skip = skipPagination ? undefined : (page - 1) * limit;
      const take = skipPagination ? undefined : limit;

      const [favorites, total] = await Promise.all([
        this.prisma.favorite.findMany({
          where: { portalUserId },
          include: {
            monument: {
              include: {
                monumentType: true,
                era: true,
                dynasty: true,
                galleries: {
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.favorite.count({ where: { portalUserId } }),
      ]);

      // Ensure we always return an array, even if empty
      const safeFavorites = favorites || [];

      logger.info('Favorites retrieved', {
        portalUserId,
        count: safeFavorites.length,
        total
      });

      return {
        data: safeFavorites,
        pagination: skipPagination
          ? { total }
          : {
              page,
              limit: limit!,
              total,
              totalPages: total > 0 && limit ? Math.ceil(total / limit) : 0,
            },
      };
    } catch (error) {
      logger.error('Error fetching favorites', {
        portalUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new AppError('FAVORITES_FETCH_ERROR', 'Failed to fetch favorites', 500);
    }
  }

  /**
   * Add a monument to favorites
   */
  async addFavorite(portalUserId: string, createFavoriteDto: CreateFavoriteDto) {
    try {
      const { monumentId, notes } = createFavoriteDto;

      logger.info('Adding favorite', { portalUserId, monumentId, notes });

      // Check if monument exists
      const monument = await this.prisma.monument.findUnique({
        where: { id: monumentId },
      });

      if (!monument) {
        logger.warn('Monument not found for favoriting', { monumentId });
        throw new AppError('MONUMENT_NOT_FOUND', 'Monument not found', 404);
      }

      // Check if already favorited
      const existing = await this.prisma.favorite.findUnique({
        where: {
          portalUserId_monumentId: {
            portalUserId,
            monumentId,
          },
        },
      });

      if (existing) {
        logger.info('Monument already in favorites', { portalUserId, monumentId });
        throw new AppError('ALREADY_FAVORITED', 'Monument already in favorites', 409);
      }

      // Create favorite
      const favorite = await this.prisma.favorite.create({
        data: {
          id: crypto.randomUUID(),
          portalUserId,
          monumentId,
          notes,
        },
        include: {
          monument: {
            include: {
              monumentType: true,
              era: true,
              dynasty: true,
              galleries: {
                take: 1,
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      logger.info('Favorite added successfully', { portalUserId, monumentId, favoriteId: favorite.id });

      return favorite;
    } catch (error) {
      logger.error('Error adding favorite', {
        portalUserId,
        monumentId: createFavoriteDto.monumentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap other errors
      throw new AppError('ADD_FAVORITE_ERROR', 'Failed to add favorite', 500);
    }
  }

  /**
   * Remove a monument from favorites
   */
  async removeFavorite(portalUserId: string, favoriteId: string) {
    try {
      logger.info('Removing favorite', { portalUserId, favoriteId });

      const favorite = await this.prisma.favorite.findUnique({
        where: { id: favoriteId },
      });

      if (!favorite) {
        logger.warn('Favorite not found for removal', { favoriteId });
        throw new AppError('FAVORITE_NOT_FOUND', 'Favorite not found', 404);
      }

      if (favorite.portalUserId !== portalUserId) {
        logger.warn('Unauthorized favorite removal attempt', { portalUserId, favoriteId });
        throw new AppError('FORBIDDEN', 'You cannot delete this favorite', 403);
      }

      await this.prisma.favorite.delete({
        where: { id: favoriteId },
      });

      logger.info('Favorite removed successfully', { portalUserId, favoriteId });
    } catch (error) {
      logger.error('Error removing favorite', {
        portalUserId,
        favoriteId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap other errors
      throw new AppError('REMOVE_FAVORITE_ERROR', 'Failed to remove favorite', 500);
    }
  }

  /**
   * Check if a monument is favorited by the user
   */
  async checkFavorite(portalUserId: string, monumentId: number) {
    try {
      const favorite = await this.prisma.favorite.findUnique({
        where: {
          portalUserId_monumentId: {
            portalUserId,
            monumentId,
          },
        },
      });

      return {
        isFavorited: !!favorite,
        favoriteId: favorite?.id || null,
      };
    } catch (error) {
      logger.error('Error checking favorite', {
        portalUserId,
        monumentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return false instead of throwing error - safer for UI
      return {
        isFavorited: false,
        favoriteId: null,
      };
    }
  }
}
