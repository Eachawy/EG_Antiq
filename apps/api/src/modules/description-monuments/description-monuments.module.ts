import { Module } from '@nestjs/common';
import { DescriptionMonumentsService } from './description-monuments.service';
import { DescriptionMonumentsController } from './description-monuments.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [DescriptionMonumentsController],
  providers: [DescriptionMonumentsService, PrismaService],
})
export class DescriptionMonumentsModule {}
