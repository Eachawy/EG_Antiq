import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { logger } from '../../logger';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all saved searches for a user
   */
  async getSavedSearches(portalUserId: string) {
    try {
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: { portalUserId },
        orderBy: { createdAt: 'desc' },
      });

      const safeSearches = savedSearches || [];

      logger.info('Saved searches retrieved', {
        portalUserId,
        count: safeSearches.length
      });

      return safeSearches;
    } catch (error) {
      logger.error('Error fetching saved searches', {
        portalUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return empty array instead of throwing error - safer for UI
      return [];
    }
  }

  /**
   * Create a new saved search
   */
  async createSavedSearch(portalUserId: string, createDto: CreateSavedSearchDto) {
    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        id: crypto.randomUUID(),
        portalUserId,
        name: createDto.name,
        keyword: createDto.keyword,
        eraIds: createDto.eraIds || [],
        dynastyIds: createDto.dynastyIds || [],
        monumentTypeIds: createDto.monumentTypeIds || [],
        dateFrom: createDto.dateFrom,
        dateTo: createDto.dateTo,
        filters: createDto.filters || {},
      },
    });

    logger.info('Saved search created', { portalUserId, savedSearchId: savedSearch.id });

    return savedSearch;
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    portalUserId: string,
    savedSearchId: string,
    updateDto: UpdateSavedSearchDto,
  ) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
    });

    if (!savedSearch) {
      throw new AppError('SAVED_SEARCH_NOT_FOUND', 'Saved search not found', 404);
    }

    if (savedSearch.portalUserId !== portalUserId) {
      throw new AppError('FORBIDDEN', 'You cannot update this saved search', 403);
    }

    const updated = await this.prisma.savedSearch.update({
      where: { id: savedSearchId },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });

    logger.info('Saved search updated', { portalUserId, savedSearchId });

    return updated;
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(portalUserId: string, savedSearchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
    });

    if (!savedSearch) {
      throw new AppError('SAVED_SEARCH_NOT_FOUND', 'Saved search not found', 404);
    }

    if (savedSearch.portalUserId !== portalUserId) {
      throw new AppError('FORBIDDEN', 'You cannot delete this saved search', 403);
    }

    await this.prisma.savedSearch.delete({
      where: { id: savedSearchId },
    });

    logger.info('Saved search deleted', { portalUserId, savedSearchId });
  }

  /**
   * Execute a saved search
   */
  async executeSavedSearch(portalUserId: string, savedSearchId: string) {
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id: savedSearchId },
    });

    if (!savedSearch) {
      throw new AppError('SAVED_SEARCH_NOT_FOUND', 'Saved search not found', 404);
    }

    if (savedSearch.portalUserId !== portalUserId) {
      throw new AppError('FORBIDDEN', 'You cannot execute this saved search', 403);
    }

    // Build where clause for monuments search
    const where: any = {};

    if (savedSearch.keyword) {
      where.OR = [
        { monumentNameEn: { contains: savedSearch.keyword, mode: 'insensitive' } },
        { monumentNameAr: { contains: savedSearch.keyword, mode: 'insensitive' } },
        { monumentBiographyEn: { contains: savedSearch.keyword, mode: 'insensitive' } },
        { monumentBiographyAr: { contains: savedSearch.keyword, mode: 'insensitive' } },
      ];
    }

    if (savedSearch.eraIds && savedSearch.eraIds.length > 0) {
      where.eraId = { in: savedSearch.eraIds };
    }

    if (savedSearch.dynastyIds && savedSearch.dynastyIds.length > 0) {
      where.dynastyId = { in: savedSearch.dynastyIds };
    }

    if (savedSearch.monumentTypeIds && savedSearch.monumentTypeIds.length > 0) {
      where.monumentsTypeId = { in: savedSearch.monumentTypeIds };
    }

    if (savedSearch.dateFrom) {
      where.startDate = { ...where.startDate, gte: savedSearch.dateFrom };
    }

    if (savedSearch.dateTo) {
      where.startDate = { ...where.startDate, lte: savedSearch.dateTo };
    }

    // Execute search
    const monuments = await this.prisma.monument.findMany({
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
      take: 50, // Limit results
    });

    // Update saved search with result count and last run time
    await this.prisma.savedSearch.update({
      where: { id: savedSearchId },
      data: {
        resultCount: monuments.length,
        lastRunAt: new Date(),
      },
    });

    logger.info('Saved search executed', {
      portalUserId,
      savedSearchId,
      resultCount: monuments.length,
    });

    return {
      savedSearch: {
        ...savedSearch,
        resultCount: monuments.length,
        lastRunAt: new Date(),
      },
      monuments,
    };
  }
}
