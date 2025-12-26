import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { TrackVisitDto } from './dto/track-visit.dto';
import { PaginationDto } from '../favorites/dto/pagination.dto';
import { logger } from '../../logger';

@Injectable()
export class BrowsingHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get browsing history for a user with optional pagination
   */
  async getHistory(portalUserId: string, paginationDto: PaginationDto) {
    const { page = 1, limit } = paginationDto;

    // If limit is 0 or undefined, return all results without pagination
    const skipPagination = !limit || limit === 0;
    const skip = skipPagination ? undefined : (page - 1) * limit;
    const take = skipPagination ? undefined : limit;

    const [history, total] = await Promise.all([
      this.prisma.browsingHistory.findMany({
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
        orderBy: { visitedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.browsingHistory.count({ where: { portalUserId } }),
    ]);

    return {
      data: history,
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
   * Track a monument visit
   */
  async trackVisit(portalUserId: string, trackVisitDto: TrackVisitDto) {
    const { monumentId, durationSeconds } = trackVisitDto;

    // Check if monument exists
    const monument = await this.prisma.monument.findUnique({
      where: { id: monumentId },
    });

    if (!monument) {
      throw new AppError('MONUMENT_NOT_FOUND', 'Monument not found', 404);
    }

    // Create browsing history entry
    const historyEntry = await this.prisma.browsingHistory.create({
      data: {
        id: crypto.randomUUID(),
        portalUserId,
        monumentId,
        durationSeconds,
        visitedAt: new Date(),
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

    logger.info('Monument visit tracked', { portalUserId, monumentId });

    return historyEntry;
  }

  /**
   * Clear all browsing history for a user
   */
  async clearHistory(portalUserId: string) {
    const result = await this.prisma.browsingHistory.deleteMany({
      where: { portalUserId },
    });

    logger.info('Browsing history cleared', { portalUserId, count: result.count });

    return { deletedCount: result.count };
  }

  /**
   * Delete a specific history entry
   */
  async deleteEntry(portalUserId: string, entryId: string) {
    const entry = await this.prisma.browsingHistory.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new AppError('ENTRY_NOT_FOUND', 'History entry not found', 404);
    }

    if (entry.portalUserId !== portalUserId) {
      throw new AppError('FORBIDDEN', 'You cannot delete this entry', 403);
    }

    await this.prisma.browsingHistory.delete({
      where: { id: entryId },
    });

    logger.info('History entry deleted', { portalUserId, entryId });
  }

  /**
   * Get browsing statistics
   */
  async getStats(portalUserId: string) {
    const totalVisits = await this.prisma.browsingHistory.count({
      where: { portalUserId },
    });

    // Get unique monuments visited
    const uniqueMonuments = await this.prisma.browsingHistory.findMany({
      where: { portalUserId },
      distinct: ['monumentId'],
      select: { monumentId: true },
    });

    // Get most visited monuments
    const mostVisited = await this.prisma.$queryRaw<
      Array<{ monumentId: number; visitCount: number }>
    >`
      SELECT monument_id as "monumentId", COUNT(*) as "visitCount"
      FROM browsing_history
      WHERE portal_user_id = ${portalUserId}::uuid
      GROUP BY monument_id
      ORDER BY "visitCount" DESC
      LIMIT 5
    `;

    return {
      totalVisits,
      uniqueMonumentsVisited: uniqueMonuments.length,
      mostVisited,
    };
  }
}
