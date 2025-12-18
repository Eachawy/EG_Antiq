import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [PrismaService],
})
export class OrganizationsModule {}
