import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, PrismaService],
  exports: [SourcesService],
})
export class SourcesModule {}
