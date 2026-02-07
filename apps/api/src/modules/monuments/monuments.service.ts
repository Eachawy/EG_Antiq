import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentDto } from './dto/create-monument.dto';
import { UpdateMonumentDto } from './dto/update-monument.dto';
import { parse } from 'csv-parse/sync';
import { logger } from '../../logger';
import { generateMonumentSlugs, ensureUniqueSlug, generateEnglishSlug, generateArabicSlug } from '@packages/common';

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
        monumentDescriptions: true,
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
    const { galleries, descriptions, slugEn, slugAr, ...monumentData } = createMonumentDto;

    // Generate slugs if not provided
    const generatedSlugs = generateMonumentSlugs(
      monumentData.monumentNameEn,
      monumentData.monumentNameAr
    );

    // Ensure uniqueness
    const finalSlugEn = await ensureUniqueSlug(
      slugEn || generatedSlugs.slugEn,
      'en',
      undefined,
      this.prisma
    );

    const finalSlugAr = await ensureUniqueSlug(
      slugAr || generatedSlugs.slugAr,
      'ar',
      undefined,
      this.prisma
    );

    // Provide default values for optional fields
    const monumentDataWithDefaults = {
      ...monumentData,
      image: monumentData.image || '',
      startDate: monumentData.startDate || new Date().toISOString().split('T')[0], // Use current date as default
      slugEn: finalSlugEn,
      slugAr: finalSlugAr,
    };

    return this.prisma.monument.create({
      data: {
        ...monumentDataWithDefaults,
        galleries: galleries?.length
          ? {
              create: galleries.map((gallery) => ({
                galleryPath: gallery.galleryPath,
                dynastyId: gallery.dynastyId ?? monumentDataWithDefaults.dynastyId,
                eraId: gallery.eraId ?? monumentDataWithDefaults.eraId,
                monumentsTypeId: gallery.monumentsTypeId ?? monumentDataWithDefaults.monumentsTypeId,
              })),
            }
          : undefined,
        monumentDescriptions: descriptions?.length
          ? {
              create: descriptions.map((desc) => ({
                descriptionAr: desc.descriptionAr,
                descriptionEn: desc.descriptionEn,
                eraId: desc.eraId ?? monumentDataWithDefaults.eraId,
                monumentsTypeId: desc.monumentsTypeId ?? monumentDataWithDefaults.monumentsTypeId,
                dynastyId: desc.dynastyId ?? monumentDataWithDefaults.dynastyId,
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
    const existing = await this.findOne(id);

    const { galleries, descriptions, slugEn, slugAr, ...monumentData } = updateMonumentDto;

    // Regenerate slugs if name changed and custom slug not provided
    let updatedSlugEn = slugEn;
    let updatedSlugAr = slugAr;

    if (monumentData.monumentNameEn && !slugEn) {
      const generated = generateEnglishSlug(monumentData.monumentNameEn);
      updatedSlugEn = await ensureUniqueSlug(generated, 'en', id, this.prisma);
    }

    if (monumentData.monumentNameAr && !slugAr) {
      const generated = generateArabicSlug(monumentData.monumentNameAr);
      updatedSlugAr = await ensureUniqueSlug(generated, 'ar', id, this.prisma);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update monument basic fields
      const updated = await tx.monument.update({
        where: { id },
        data: {
          ...monumentData,
          ...(updatedSlugEn && { slugEn: updatedSlugEn }),
          ...(updatedSlugAr && { slugAr: updatedSlugAr }),
        },
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
   * CSV columns: monumentNameAr,monumentNameEn,monumentBiographyAr,monumentBiographyEn,lat,lng,image,startDate,endDate,startDateHijri,endDateHijri,artifactRegistrationNumber,monumentsTypeId,eraId,dynastyId,zoom,center,descriptionEn,descriptionAr
   */
  async importFromCsv(file: Express.Multer.File) {
    try {
      // Remove BOM if present and convert to UTF-8
      let csvContent = file.buffer.toString('utf-8');
      if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
        logger.info('Removed BOM character from CSV');
      }

      // Parse CSV - returns array of objects with string values
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle BOM
        relax_column_count: true, // Allow inconsistent column count
      }) as Record<string, string>[];

      let created = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      logger.info(`Starting CSV import with ${records.length} records`);

      // Log first record structure for debugging
      if (records.length > 0) {
        logger.info('CSV columns detected:', { columns: Object.keys(records[0]) });
        logger.info('First record sample:', {
          monumentNameEn: records[0].monumentNameEn,
          monumentNameAr: records[0].monumentNameAr,
          startDate: records[0].startDate,
        });
      }

      for (const [index, record] of records.entries()) {
        try {
          // Validate required fields
          if (!record.monumentNameEn || !record.monumentNameAr) {
            // Log the actual record for debugging
            logger.error(`Row ${index + 2} missing names. Available fields:`, {
              fields: Object.keys(record),
              values: record
            });
            throw new Error('Monument name (English and Arabic) is required');
          }

          // Parse and validate IDs
          const monumentsTypeId = parseInt(record.monumentsTypeId, 10);
          const eraId = parseInt(record.eraId, 10);
          const dynastyId = parseInt(record.dynastyId, 10);

          // Validate that IDs are valid numbers
          if (isNaN(monumentsTypeId)) {
            throw new Error(`Invalid monumentsTypeId: "${record.monumentsTypeId}" - must be a number`);
          }
          if (isNaN(eraId)) {
            throw new Error(`Invalid eraId: "${record.eraId}" - must be a number`);
          }
          if (isNaN(dynastyId)) {
            throw new Error(`Invalid dynastyId: "${record.dynastyId}" - must be a number`);
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
            startDate: record.startDate || new Date().toLocaleDateString(),
            monumentsTypeId: monumentsTypeId,
            eraId: eraId,
            dynastyId: dynastyId,
            zoom: record.zoom || '10',
            center: record.center || `${record.lat || '0'},${record.lng || '0'}`,
          };

          // Add optional date fields if provided
          if (record.endDate && record.endDate.trim()) {
            monumentData.endDate = record.endDate.trim();
          }
          if (record.startDateHijri && record.startDateHijri.trim()) {
            monumentData.startDateHijri = record.startDateHijri.trim();
            logger.info(`Adding startDateHijri for monument ${index + 1}: ${monumentData.startDateHijri}`);
          }
          if (record.endDateHijri && record.endDateHijri.trim()) {
            monumentData.endDateHijri = record.endDateHijri.trim();
            logger.info(`Adding endDateHijri for monument ${index + 1}: ${monumentData.endDateHijri}`);
          }

          // Add artifact registration number if provided
          if (record.artifactRegistrationNumber && record.artifactRegistrationNumber.trim()) {
            monumentData.artifactRegistrationNumber = record.artifactRegistrationNumber.trim();
          }

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
