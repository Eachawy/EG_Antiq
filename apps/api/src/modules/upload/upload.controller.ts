import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { logger } from '../../logger';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = `/uploads/gallery/${file.filename}`;
    logger.info('Image uploaded successfully', {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    });

    return {
      data: {
        filename: file.filename,
        path: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
      },
      message: 'Image uploaded successfully',
    };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      path: `/uploads/gallery/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    logger.info('Multiple images uploaded successfully', {
      count: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    });

    return {
      data: uploadedFiles,
      message: `${files.length} image(s) uploaded successfully`,
    };
  }
}
