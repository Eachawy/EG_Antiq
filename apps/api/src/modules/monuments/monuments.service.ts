import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentDto } from './dto/create-monument.dto';
import { UpdateMonumentDto } from './dto/update-monument.dto';

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
        descriptionMonuments: true,
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
        descriptionMonuments: descriptions?.length
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
        descriptionMonuments: true,
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
            monumentsId: id,
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
                monumentsId: id,
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
          descriptionMonuments: true,
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
}
