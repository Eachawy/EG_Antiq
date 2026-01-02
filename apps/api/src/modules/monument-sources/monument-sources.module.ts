import { Module } from '@nestjs/common';
import { MonumentSourcesService } from './monument-sources.service';
import { MonumentSourcesController } from './monument-sources.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MonumentSourcesController],
  providers: [MonumentSourcesService, PrismaService],
  exports: [MonumentSourcesService],
})
export class MonumentSourcesModule {}
