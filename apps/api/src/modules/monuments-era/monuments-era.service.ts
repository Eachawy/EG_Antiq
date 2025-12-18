import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '@packages/common';
import { CreateMonumentEraDto } from './dto/create-monument-era.dto';
import { UpdateMonumentEraDto } from './dto/update-monument-era.dto';

@Injectable()
export class MonumentsEraService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all monument-era relationships
   */
  async findAll() {
    return this.prisma.monumentEra.findMany({
      include: {
        era: true,
        monumentType: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single monument-era by ID
   */
  async findOne(id: number) {
    const monumentEra = await this.prisma.monumentEra.findUnique({
      where: { id },
      include: {
        era: true,
        monumentType: true,
      },
    });

    if (!monumentEra) {
      throw new NotFoundError('Monument Era', id.toString());
    }

    return monumentEra;
  }

  /**
   * Create a new monument-era relationship
   */
  async create(createMonumentEraDto: CreateMonumentEraDto) {
    return this.prisma.monumentEra.create({
      data: createMonumentEraDto,
      include: {
        era: true,
        monumentType: true,
      },
    });
  }

  /**
   * Update a monument-era relationship
   */
  async update(id: number, updateMonumentEraDto: UpdateMonumentEraDto) {
    await this.findOne(id);

    return this.prisma.monumentEra.update({
      where: { id },
      data: updateMonumentEraDto,
      include: {
        era: true,
        monumentType: true,
      },
    });
  }

  /**
   * Delete a monument-era relationship
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.monumentEra.delete({
      where: { id },
    });

    return { message: 'Monument-era relationship deleted successfully' };
  }
}
