import { Module } from '@nestjs/common';
import { DynastiesService } from './dynasties.service';
import { DynastiesController } from './dynasties.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [DynastiesController],
  providers: [DynastiesService, PrismaService],
})
export class DynastiesModule {}
