import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentSourceDto } from './dto/create-monument-source.dto';
import { UpdateMonumentSourceDto } from './dto/update-monument-source.dto';
import { LinkSourcesToMonumentDto } from './dto/link-sources-to-monument.dto';

@Injectable()
export class MonumentSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all monument-source links
   */
  async findAll() {
    return this.prisma.monumentSource.findMany({
      include: {
        monument: {
          select: {
            id: true,
            monumentNameEn: true,
            monumentNameAr: true,
          },
        },
        source: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single monument-source link by ID
   */
  async findOne(id: number) {
    const link = await this.prisma.monumentSource.findUnique({
      where: { id },
      include: {
        monument: {
          select: {
            id: true,
            monumentNameEn: true,
            monumentNameAr: true,
          },
        },
        source: true,
      },
    });

    if (!link) {
      throw new NotFoundError('Monument-Source link', id.toString());
    }

    return link;
  }

  /**
   * Get all sources for a specific monument
   */
  async findByMonumentId(monumentId: number) {
    return this.prisma.monumentSource.findMany({
      where: { monumentId },
      include: {
        source: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  /**
   * Create a new monument-source link
   */
  async create(createDto: CreateMonumentSourceDto) {
    // Verify monument exists
    const monument = await this.prisma.monument.findUnique({
      where: { id: createDto.monumentId },
    });
    if (!monument) {
      throw new NotFoundError('Monument', createDto.monumentId.toString());
    }

    // Verify source exists
    const source = await this.prisma.source.findUnique({
      where: { id: createDto.sourceId },
    });
    if (!source) {
      throw new NotFoundError('Source', createDto.sourceId.toString());
    }

    return this.prisma.monumentSource.create({
      data: createDto,
      include: {
        monument: {
          select: {
            id: true,
            monumentNameEn: true,
            monumentNameAr: true,
          },
        },
        source: true,
      },
    });
  }

  /**
   * Bulk link multiple sources to a monument
   */
  async bulkLinkToMonument(dto: LinkSourcesToMonumentDto) {
    return this.prisma.$transaction(async (tx) => {
      // Validate monument exists
      const monument = await tx.monument.findUnique({
        where: { id: dto.monumentId },
      });
      if (!monument) {
        throw new NotFoundError('Monument', dto.monumentId.toString());
      }

      // Validate all sources exist
      const sources = await tx.source.findMany({
        where: { id: { in: dto.sourceIds } },
      });
      if (sources.length !== dto.sourceIds.length) {
        throw new BadRequestException('One or more sources not found');
      }

      // Create links
      const links = await Promise.all(
        dto.sourceIds.map((sourceId, index) =>
          tx.monumentSource.create({
            data: {
              monumentId: dto.monumentId,
              sourceId,
              displayOrder: (dto.startDisplayOrder || 0) + index,
            },
            include: {
              source: true,
            },
          })
        )
      );

      return {
        message: `Successfully linked ${links.length} sources to monument`,
        data: links,
      };
    });
  }

  /**
   * Update a monument-source link
   */
  async update(id: number, updateDto: UpdateMonumentSourceDto) {
    await this.findOne(id);

    // If updating monumentId or sourceId, verify they exist
    if (updateDto.monumentId) {
      const monument = await this.prisma.monument.findUnique({
        where: { id: updateDto.monumentId },
      });
      if (!monument) {
        throw new NotFoundError('Monument', updateDto.monumentId.toString());
      }
    }

    if (updateDto.sourceId) {
      const source = await this.prisma.source.findUnique({
        where: { id: updateDto.sourceId },
      });
      if (!source) {
        throw new NotFoundError('Source', updateDto.sourceId.toString());
      }
    }

    return this.prisma.monumentSource.update({
      where: { id },
      data: updateDto,
      include: {
        monument: {
          select: {
            id: true,
            monumentNameEn: true,
            monumentNameAr: true,
          },
        },
        source: true,
      },
    });
  }

  /**
   * Delete a monument-source link
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.monumentSource.delete({
      where: { id },
    });

    return { message: 'Monument-Source link deleted successfully' };
  }

  /**
   * Delete a specific monument-source link by monument and source IDs
   */
  async removeByMonumentAndSource(monumentId: number, sourceId: number) {
    const link = await this.prisma.monumentSource.findFirst({
      where: {
        monumentId,
        sourceId,
      },
    });

    if (!link) {
      throw new NotFoundError(
        'Monument-Source link',
        `monumentId=${monumentId}, sourceId=${sourceId}`
      );
    }

    await this.prisma.monumentSource.delete({
      where: { id: link.id },
    });

    return { message: 'Monument-Source link deleted successfully' };
  }
}
