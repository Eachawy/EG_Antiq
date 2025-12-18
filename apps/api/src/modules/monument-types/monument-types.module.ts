import { Module } from '@nestjs/common';
import { MonumentTypesService } from './monument-types.service';
import { MonumentTypesController } from './monument-types.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MonumentTypesController],
  providers: [MonumentTypesService, PrismaService],
})
export class MonumentTypesModule {}
