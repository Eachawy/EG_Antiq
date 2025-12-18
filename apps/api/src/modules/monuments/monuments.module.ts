import { Module } from '@nestjs/common';
import { MonumentsService } from './monuments.service';
import { MonumentsController } from './monuments.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MonumentsController],
  providers: [MonumentsService, PrismaService],
})
export class MonumentsModule {}
