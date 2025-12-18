import { Module } from '@nestjs/common';
import { MonumentsEraService } from './monuments-era.service';
import { MonumentsEraController } from './monuments-era.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MonumentsEraController],
  providers: [MonumentsEraService, PrismaService],
})
export class MonumentsEraModule {}
