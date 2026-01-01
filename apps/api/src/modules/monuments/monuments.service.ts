import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentDto } from './dto/create-monument.dto';
import { UpdateMonumentDto } from './dto/update-monument.dto';
import { parse } from 'csv-parse/sync';
import { logger } from '../../logger';

@Injectable()
export class MonumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all monuments with related data
   */
  async findAll() {
    return this.prisma.monument.findMany({
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single monument by ID
   */
  async findOne(id: number) {
    const monument = await this.prisma.monument.findUnique({
      where: { id },
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
        galleries: true,
        monumentDescriptions: true,
      },
    });

    if (!monument) {
      throw new NotFoundError('Monument', id.toString());
    }

    return monument;
  }

  /**
   * Create a new monument with nested galleries and descriptions
   */
  async create(createMonumentDto: CreateMonumentDto) {
    const { galleries, descriptions, ...monumentData } = createMonumentDto;

    return this.prisma.monument.create({
      data: {
        ...monumentData,
        galleries: galleries?.length
          ? {
              create: galleries.map((gallery) => ({
                galleryPath: gallery.galleryPath,
                dynastyId: gallery.dynastyId ?? monumentData.dynastyId,
                eraId: gallery.eraId ?? monumentData.eraId,
                monumentsTypeId: gallery.monumentsTypeId ?? monumentData.monumentsTypeId,
              })),
            }
          : undefined,
        monumentDescriptions: descriptions?.length
          ? {
              create: descriptions.map((desc) => ({
                descriptionAr: desc.descriptionAr,
                descriptionEn: desc.descriptionEn,
                eraId: desc.eraId ?? monumentData.eraId,
                monumentsTypeId: desc.monumentsTypeId ?? monumentData.monumentsTypeId,
                dynastyId: desc.dynastyId ?? monumentData.dynastyId,
              })),
            }
          : undefined,
      },
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
        galleries: true,
        monumentDescriptions: true,
      },
    });
  }

  /**
   * Update a monument with nested galleries and descriptions
   */
  async update(id: number, updateMonumentDto: UpdateMonumentDto) {
    // Check if monument exists
    await this.findOne(id);

    const { galleries, descriptions, ...monumentData } = updateMonumentDto;

    return this.prisma.$transaction(async (tx) => {
      // Update monument basic fields
      const updated = await tx.monument.update({
        where: { id },
        data: monumentData,
      });

      // Handle galleries if provided
      if (galleries !== undefined) {
        // Get IDs of galleries to keep/update
        const galleryIdsToKeep = galleries.filter((g) => g.id).map((g) => g.id!);

        // Delete galleries not in the update list
        await tx.gallery.deleteMany({
          where: {
            monumentsId: id,
            id: { notIn: galleryIdsToKeep },
          },
        });

        // Update or create galleries
        for (const gallery of galleries) {
          if (gallery.id) {
            // Update existing gallery
            await tx.gallery.update({
              where: { id: gallery.id },
              data: {
                galleryPath: gallery.galleryPath,
                dynastyId: gallery.dynastyId ?? updated.dynastyId,
                eraId: gallery.eraId ?? updated.eraId,
                monumentsTypeId: gallery.monumentsTypeId ?? updated.monumentsTypeId,
              },
            });
          } else {
            // Create new gallery
            await tx.gallery.create({
              data: {
                monumentsId: id,
                galleryPath: gallery.galleryPath!,
                dynastyId: gallery.dynastyId ?? updated.dynastyId,
                eraId: gallery.eraId ?? updated.eraId,
                monumentsTypeId: gallery.monumentsTypeId ?? updated.monumentsTypeId,
              },
            });
          }
        }
      }

      // Handle descriptions if provided
      if (descriptions !== undefined) {
        // Get IDs of descriptions to keep/update
        const descriptionIdsToKeep = descriptions.filter((d) => d.id).map((d) => d.id!);

        // Delete descriptions not in the update list
        await tx.descriptionMonument.deleteMany({
          where: {
            monumentId: id,
            id: { notIn: descriptionIdsToKeep },
          },
        });

        // Update or create descriptions
        for (const desc of descriptions) {
          if (desc.id) {
            // Update existing description
            await tx.descriptionMonument.update({
              where: { id: desc.id },
              data: {
                descriptionAr: desc.descriptionAr,
                descriptionEn: desc.descriptionEn,
                eraId: desc.eraId ?? updated.eraId,
                monumentsTypeId: desc.monumentsTypeId ?? updated.monumentsTypeId,
                dynastyId: desc.dynastyId ?? updated.dynastyId,
              },
            });
          } else {
            // Create new description
            await tx.descriptionMonument.create({
              data: {
                monumentId: id,
                descriptionAr: desc.descriptionAr!,
                descriptionEn: desc.descriptionEn!,
                eraId: desc.eraId ?? updated.eraId,
                monumentsTypeId: desc.monumentsTypeId ?? updated.monumentsTypeId,
                dynastyId: desc.dynastyId ?? updated.dynastyId,
              },
            });
          }
        }
      }

      // Return updated monument with all relations
      return tx.monument.findUnique({
        where: { id },
        include: {
          monumentType: true,
          era: true,
          dynasty: true,
          galleries: true,
          monumentDescriptions: true,
        },
      });
    });
  }

  /**
   * Delete a monument
   */
  async remove(id: number) {
    // Check if monument exists
    await this.findOne(id);

    await this.prisma.monument.delete({
      where: { id },
    });

    return { message: 'Monument deleted successfully' };
  }

  /**
   * Import monuments from CSV file
   * CSV columns: monumentNameAr,monumentNameEn,monumentBiographyAr,monumentBiographyEn,lat,lng,image,mDate,monumentsTypeId,eraId,dynastyId,zoom,center,descriptionEn,descriptionAr
   */
  async importFromCsv(file: Express.Multer.File) {
    try {
      const csvContent = file.buffer.toString('utf-8');

      // Parse CSV - returns array of objects with string values
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      let created = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      logger.info(`Starting CSV import with ${records.length} records`);

      for (const [index, record] of records.entries()) {
        try {
          // Validate required fields
          if (!record.monumentNameEn || !record.monumentNameAr) {
            throw new Error('Monument name (English and Arabic) is required');
          }

          // Convert string IDs to numbers
          const monumentData: CreateMonumentDto = {
            monumentNameAr: record.monumentNameAr,
            monumentNameEn: record.monumentNameEn,
            monumentBiographyAr: record.monumentBiographyAr || '',
            monumentBiographyEn: record.monumentBiographyEn || '',
            lat: record.lat || '0',
            lng: record.lng || '0',
            image: record.image || '',
            mDate: record.mDate || new Date().toLocaleDateString(),
            monumentsTypeId: parseInt(record.monumentsTypeId, 10),
            eraId: parseInt(record.eraId, 10),
            dynastyId: parseInt(record.dynastyId, 10),
            zoom: record.zoom || '10',
            center: record.center || `${record.lat || '0'},${record.lng || '0'}`,
          };

          // Add descriptions if provided
          if (record.descriptionEn || record.descriptionAr) {
            monumentData.descriptions = [
              {
                descriptionEn: record.descriptionEn || '',
                descriptionAr: record.descriptionAr || '',
                eraId: monumentData.eraId,
                monumentsTypeId: monumentData.monumentsTypeId,
                dynastyId: monumentData.dynastyId,
              },
            ];
          }

          // Create monument
          await this.create(monumentData);
          created++;
          logger.info(`Successfully imported monument ${index + 1}: ${monumentData.monumentNameEn}`);
        } catch (error: any) {
          errors++;
          const errorMsg = `Row ${index + 2}: ${error?.message || 'Unknown error'}`;
          errorDetails.push(errorMsg);
          logger.error(`Error importing monument at row ${index + 2}`, { error: error?.message || 'Unknown error' });
        }
      }

      return {
        created,
        errors,
        total: records.length,
        errorDetails,
      };
    } catch (error: any) {
      logger.error('Failed to parse CSV file', { error });
      throw new BadRequestException(`Failed to parse CSV file: ${error?.message || 'Unknown error'}`);
    }
  }
}
