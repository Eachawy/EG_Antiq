import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateDynastyDto } from './dto/create-dynasty.dto';
import { UpdateDynastyDto } from './dto/update-dynasty.dto';

@Injectable()
export class DynastiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all dynasties
   */
  async findAll() {
    return this.prisma.dynasty.findMany({
      include: {
        era: true,
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
   * Get a single dynasty by ID
   */
  async findOne(id: number) {
    const dynasty = await this.prisma.dynasty.findUnique({
      where: { id },
      include: {
        era: true,
        monuments: {
          take: 10,
        },
      },
    });

    if (!dynasty) {
      throw new NotFoundError('Dynasty', id.toString());
    }

    return dynasty;
  }

  /**
   * Create a new dynasty
   */
  async create(createDynastyDto: CreateDynastyDto) {
    return this.prisma.dynasty.create({
      data: createDynastyDto,
      include: {
        era: true,
      },
    });
  }

  /**
   * Update a dynasty
   */
  async update(id: number, updateDynastyDto: UpdateDynastyDto) {
    await this.findOne(id);

    return this.prisma.dynasty.update({
      where: { id },
      data: updateDynastyDto,
      include: {
        era: true,
      },
    });
  }

  /**
   * Delete a dynasty
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.dynasty.delete({
      where: { id },
    });

    return { message: 'Dynasty deleted successfully' };
  }
}
