import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '@packages/common';
import { User } from '@packages/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId: tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    return user;
  }

  async findMany(tenantId: string, limit: number = 20): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        organizationId: tenantId,
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
