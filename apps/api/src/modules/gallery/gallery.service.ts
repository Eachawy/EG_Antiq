import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '@packages/common';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Delete a gallery item
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.gallery.delete({
      where: { id },
    });

    return { message: 'Gallery item deleted successfully' };
  }
}
