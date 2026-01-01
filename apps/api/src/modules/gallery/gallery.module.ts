import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [GalleryController],
  providers: [GalleryService, PrismaService],
})
export class GalleryModule {}
