import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '@packages/common';
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
      },
    });

    if (!monument) {
      throw new NotFoundError('Monument', id.toString());
    }

    return monument;
  }

  /**
   * Create a new monument
   */
  async create(createMonumentDto: CreateMonumentDto) {
    return this.prisma.monument.create({
      data: createMonumentDto,
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
      },
    });
  }

  /**
   * Update a monument
   */
  async update(id: number, updateMonumentDto: UpdateMonumentDto) {
    // Check if monument exists
    await this.findOne(id);

    return this.prisma.monument.update({
      where: { id },
      data: updateMonumentDto,
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
      },
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
