import { Module } from '@nestjs/common';
import { ErasService } from './eras.service';
import { ErasController } from './eras.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [ErasController],
  providers: [ErasService, PrismaService],
})
export class ErasModule {}
