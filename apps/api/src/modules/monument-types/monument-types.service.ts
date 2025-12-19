import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentTypeDto } from './dto/create-monument-type.dto';
import { UpdateMonumentTypeDto } from './dto/update-monument-type.dto';

@Injectable()
export class MonumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all monument types
   */
  async findAll() {
    return this.prisma.monumentType.findMany({
      include: {
        _count: {
          select: {
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
   * Get a single monument type by ID
   */
  async findOne(id: number) {
    const monumentType = await this.prisma.monumentType.findUnique({
      where: { id },
      include: {
        monuments: {
          take: 10,
        },
      },
    });

    if (!monumentType) {
      throw new NotFoundError('Monument Type', id.toString());
    }

    return monumentType;
  }

  /**
   * Create a new monument type
   */
  async create(createMonumentTypeDto: CreateMonumentTypeDto) {
    return this.prisma.monumentType.create({
      data: createMonumentTypeDto,
    });
  }

  /**
   * Update a monument type
   */
  async update(id: number, updateMonumentTypeDto: UpdateMonumentTypeDto) {
    await this.findOne(id);

    return this.prisma.monumentType.update({
      where: { id },
      data: updateMonumentTypeDto,
    });
  }

  /**
   * Delete a monument type
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.monumentType.delete({
      where: { id },
    });

    return { message: 'Monument type deleted successfully' };
  }
}
