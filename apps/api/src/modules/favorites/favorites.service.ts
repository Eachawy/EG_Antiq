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

    return {
      data: favorites,
      pagination: skipPagination
        ? { total }
        : {
            page,
            limit: limit!,
            total,
            totalPages: Math.ceil(total / limit!),
          },
    };
  }

  /**
   * Add a monument to favorites
   */
  async addFavorite(portalUserId: string, createFavoriteDto: CreateFavoriteDto) {
    const { monumentId, notes } = createFavoriteDto;

    // Check if monument exists
    const monument = await this.prisma.monument.findUnique({
      where: { id: monumentId },
    });

    if (!monument) {
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

    logger.info('Favorite added', { portalUserId, monumentId });

    return favorite;
  }

  /**
   * Remove a monument from favorites
   */
  async removeFavorite(portalUserId: string, favoriteId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite) {
      throw new AppError('FAVORITE_NOT_FOUND', 'Favorite not found', 404);
    }

    if (favorite.portalUserId !== portalUserId) {
      throw new AppError('FORBIDDEN', 'You cannot delete this favorite', 403);
    }

    await this.prisma.favorite.delete({
      where: { id: favoriteId },
    });

    logger.info('Favorite removed', { portalUserId, favoriteId });
  }

  /**
   * Check if a monument is favorited by the user
   */
  async checkFavorite(portalUserId: string, monumentId: number) {
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
  }
}
