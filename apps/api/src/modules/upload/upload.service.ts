import { Injectable } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../logger';

@Injectable()
export class UploadService {
  private readonly uploadDir =
    process.env.NODE_ENV === 'production'
      ? '/app/uploads/gallery'
      : './uploads/gallery';

  /**
   * Delete a file from the server
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(this.uploadDir, filename);
      await unlink(filePath);
      logger.info('File deleted successfully', { filename });
    } catch (error) {
      logger.error('Error deleting file', { filename, error });
      throw error;
    }
  }

  /**
   * Get the full path for a filename
   */
  getFilePath(filename: string): string {
    return `/uploads/gallery/${filename}`;
  }
}
