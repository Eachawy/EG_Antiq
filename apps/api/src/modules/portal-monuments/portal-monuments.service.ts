import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { logger } from '../../logger';
import { calculatePagination, createPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class PortalMonumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all monuments (PUBLIC - no authentication required)
   */
  async findAll(page: number = 1, limit?: number, portalUserId?: string) {
    const { skip, take, skipPagination } = calculatePagination(page, limit);

    // Get all monuments with optional pagination
    const [monuments, total] = await Promise.all([
      this.prisma.monument.findMany({
        include: {
          monumentType: true,
          era: true,
          dynasty: true,
          galleries: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.monument.count(),
    ]);

    // If user is authenticated, check which monuments are favorited
    let monumentsWithFavorites = monuments;
    if (portalUserId) {
      const favoriteMonumentIds = await this.prisma.favorite.findMany({
        where: {
          portalUserId,
          monumentId: { in: monuments.map((m) => m.id) },
        },
        select: { monumentId: true },
      });

      const favoritedIds = new Set(favoriteMonumentIds.map((f) => f.monumentId));

      monumentsWithFavorites = monuments.map((monument) => ({
        ...monument,
        isFavorited: favoritedIds.has(monument.id),
      }));
    }

    logger.info('All monuments retrieved', {
      page,
      limit,
      resultCount: monuments.length,
      total,
      portalUserId,
    });

    return {
      data: monumentsWithFavorites,
      pagination: skipPagination
        ? { total }
        : createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Advanced search for monuments (PUBLIC - no authentication required)
   */
  async search(filters: SearchFiltersDto, portalUserId?: string) {
    const { keyword, eraIds, dynastyIds, monumentTypeIds, dateFrom, dateTo, page = 1, limit } = filters;

    const { skip, take, skipPagination } = calculatePagination(page, limit);

    // Build where clause
    const where: Prisma.MonumentWhereInput = {};

    if (keyword) {
      where.OR = [
        { monumentNameEn: { contains: keyword, mode: 'insensitive' } },
        { monumentNameAr: { contains: keyword, mode: 'insensitive' } },
        { monumentBiographyEn: { contains: keyword, mode: 'insensitive' } },
        { monumentBiographyAr: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (eraIds && eraIds.length > 0) {
      where.eraId = { in: eraIds };
    }

    if (dynastyIds && dynastyIds.length > 0) {
      where.dynastyId = { in: dynastyIds };
    }

    if (monumentTypeIds && monumentTypeIds.length > 0) {
      where.monumentsTypeId = { in: monumentTypeIds };
    }

    if (dateFrom || dateTo) {
      where.mDate = {};
      if (dateFrom) where.mDate.gte = dateFrom;
      if (dateTo) where.mDate.lte = dateTo;
    }

    // Execute search
    const [monuments, total] = await Promise.all([
      this.prisma.monument.findMany({
        where,
        include: {
          monumentType: true,
          era: true,
          dynasty: true,
          galleries: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.monument.count({ where }),
    ]);

    // If user is authenticated, check which monuments are favorited
    let monumentsWithFavorites = monuments;
    if (portalUserId) {
      const favoriteMonumentIds = await this.prisma.favorite.findMany({
        where: {
          portalUserId,
          monumentId: { in: monuments.map((m) => m.id) },
        },
        select: { monumentId: true },
      });

      const favoritedIds = new Set(favoriteMonumentIds.map((f) => f.monumentId));

      monumentsWithFavorites = monuments.map((monument) => ({
        ...monument,
        isFavorited: favoritedIds.has(monument.id),
      }));
    }

    logger.info('Monument search performed', {
      filters,
      resultCount: monuments.length,
      portalUserId,
    });

    return {
      data: monumentsWithFavorites,
      pagination: skipPagination
        ? { total }
        : createPaginationMeta(total, page, limit),
    };
  }

  /**
   * Get monument details by ID (PUBLIC - no authentication required)
   */
  async getById(id: number, portalUserId?: string) {
    const monument = await this.prisma.monument.findUnique({
      where: { id },
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
        galleries: {
          orderBy: { createdAt: 'asc' },
        },
        monumentDescriptions: true,
        monumentsEra: {
          include: {
            era: true,
          },
        },
        monumentSources: {
          include: {
            source: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        monumentBooks: {
          include: {
            book: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!monument) {
      throw new AppError('MONUMENT_NOT_FOUND', 'Monument not found', 404);
    }

    // If user is authenticated, check if favorited
    let monumentWithFavorite: any = monument;
    if (portalUserId) {
      const favorite = await this.prisma.favorite.findUnique({
        where: {
          portalUserId_monumentId: {
            portalUserId,
            monumentId: id,
          },
        },
      });

      monumentWithFavorite = {
        ...monument,
        isFavorited: !!favorite,
      };
    }

    return monumentWithFavorite;
  }
}
