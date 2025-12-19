import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';

@Injectable()
export class ErasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all eras
   */
  async findAll() {
    return this.prisma.era.findMany({
      include: {
        _count: {
          select: {
            dynasties: true,
            monuments: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  /**
   * Get a single era by ID
   */
  async findOne(id: number) {
    const era = await this.prisma.era.findUnique({
      where: { id },
      include: {
        dynasties: true,
        monuments: {
          take: 10,
        },
      },
    });

    if (!era) {
      throw new NotFoundError('Era', id.toString());
    }

    return era;
  }

  /**
   * Create a new era
   */
  async create(createEraDto: CreateEraDto) {
    return this.prisma.era.create({
      data: createEraDto,
    });
  }

  /**
   * Update an era
   */
  async update(id: number, updateEraDto: UpdateEraDto) {
    await this.findOne(id);

    return this.prisma.era.update({
      where: { id },
      data: updateEraDto,
    });
  }

  /**
   * Delete an era
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.era.delete({
      where: { id },
    });

    return { message: 'Era deleted successfully' };
  }
}
