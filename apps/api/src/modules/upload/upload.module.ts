import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.NODE_ENV === 'production'
          ? '/app/uploads/gallery'
          : './uploads/gallery',
        filename: (_req, file, callback) => {
          // Generate unique filename: timestamp-randomstring.ext
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (_req, file, callback) => {
        // Accept images only - check both MIME type and extension
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

        const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.test(file.originalname);

        if (hasValidMimeType || hasValidExtension) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `Invalid file type. Allowed: jpg, jpeg, png, gif, webp, svg. Got: ${file.mimetype} (${file.originalname})`
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
