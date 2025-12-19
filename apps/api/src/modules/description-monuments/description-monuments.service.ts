import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateDescriptionMonumentDto } from './dto/create-description-monument.dto';
import { UpdateDescriptionMonumentDto } from './dto/update-description-monument.dto';

@Injectable()
export class DescriptionMonumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all description monuments
   */
  async findAll() {
    return this.prisma.descriptionMonument.findMany({
      include: {
        era: true,
        monumentType: true,
        dynasty: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single description monument by ID
   */
  async findOne(id: number) {
    const descriptionMonument = await this.prisma.descriptionMonument.findUnique({
      where: { id },
      include: {
        era: true,
        monumentType: true,
        dynasty: true,
      },
    });

    if (!descriptionMonument) {
      throw new NotFoundError('Description Monument', id.toString());
    }

    return descriptionMonument;
  }

  /**
   * Create a new description monument
   */
  async create(createDescriptionMonumentDto: CreateDescriptionMonumentDto) {
    return this.prisma.descriptionMonument.create({
      data: createDescriptionMonumentDto,
      include: {
        era: true,
        monumentType: true,
        dynasty: true,
      },
    });
  }

  /**
   * Update a description monument
   */
  async update(id: number, updateDescriptionMonumentDto: UpdateDescriptionMonumentDto) {
    await this.findOne(id);

    return this.prisma.descriptionMonument.update({
      where: { id },
      data: updateDescriptionMonumentDto,
      include: {
        era: true,
        monumentType: true,
        dynasty: true,
      },
    });
  }

  /**
   * Delete a description monument
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.descriptionMonument.delete({
      where: { id },
    });

    return { message: 'Description monument deleted successfully' };
  }
}
