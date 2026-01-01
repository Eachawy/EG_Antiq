import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { UploadService } from '../upload/upload.service';
import { logger } from '../../logger';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get all gallery items
   */
  async findAll() {
    return this.prisma.gallery.findMany({
      include: {
        dynasty: true,
        era: true,
        monumentType: true,
        monument: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single gallery item by ID
   */
  async findOne(id: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id },
      include: {
        dynasty: true,
        era: true,
        monumentType: true,
        monument: true,
      },
    });

    if (!gallery) {
      throw new NotFoundError('Gallery', id.toString());
    }

    return gallery;
  }

  /**
   * Create a new gallery item
   */
  async create(createGalleryDto: CreateGalleryDto) {
    return this.prisma.gallery.create({
      data: createGalleryDto,
      include: {
        dynasty: true,
        era: true,
        monumentType: true,
        monument: true,
      },
    });
  }

  /**
   * Update a gallery item
   */
  async update(id: number, updateGalleryDto: UpdateGalleryDto) {
    await this.findOne(id);

    return this.prisma.gallery.update({
      where: { id },
      data: updateGalleryDto,
      include: {
        dynasty: true,
        era: true,
        monumentType: true,
        monument: true,
      },
    });
  }

  /**
   * Delete a gallery item and its associated file
   */
  async remove(id: number) {
    const gallery = await this.findOne(id);

    // Extract filename from galleryPath (e.g., "/uploads/gallery/image.jpg" -> "image.jpg")
    if (gallery.galleryPath && gallery.galleryPath.startsWith('/uploads/gallery/')) {
      const filename = gallery.galleryPath.replace('/uploads/gallery/', '');

      try {
        // Delete the physical file from the server
        await this.uploadService.deleteFile(filename);
        logger.info('Gallery image file deleted', { filename, galleryId: id });
      } catch (error: any) {
        // Log error but continue with database deletion
        // File might not exist or already deleted
        logger.warn('Failed to delete gallery image file', {
          filename,
          galleryId: id,
          error: error?.message || 'Unknown error'
        });
      }
    }

    // Delete the database record
    await this.prisma.gallery.delete({
      where: { id },
    });

    return { message: 'Gallery item deleted successfully' };
  }
}
