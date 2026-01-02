import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { parse } from 'csv-parse/sync';
import { logger } from '../../logger';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all sources with monument count
   */
  async findAll() {
    return this.prisma.source.findMany({
      include: {
        _count: {
          select: {
            monumentSources: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single source by ID with monument count
   */
  async findOne(id: number) {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            monumentSources: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundError('Source', id.toString());
    }

    return source;
  }

  /**
   * Create a new source
   */
  async create(createSourceDto: CreateSourceDto) {
    return this.prisma.source.create({
      data: createSourceDto,
    });
  }

  /**
   * Update a source
   */
  async update(id: number, updateSourceDto: UpdateSourceDto) {
    await this.findOne(id);

    return this.prisma.source.update({
      where: { id },
      data: updateSourceDto,
    });
  }

  /**
   * Delete a source
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.source.delete({
      where: { id },
    });

    return { message: 'Source deleted successfully' };
  }

  /**
   * Import sources from CSV file
   * CSV columns: titleEn,titleAr,authorEn,authorAr,publicationYear,publisher,sourceType,url,pages,volume,issue,isbn,doi,notes
   */
  async importFromCsv(file: Express.Multer.File) {
    try {
      const csvContent = file.buffer.toString('utf-8');

      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      let created = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      logger.info(`Starting source CSV import with ${records.length} records`);

      for (const [index, record] of records.entries()) {
        try {
          // Validate required fields
          if (!record.titleEn || !record.titleAr) {
            throw new Error('Source title (English and Arabic) is required');
          }

          // Prepare source data
          const sourceData: any = {
            titleEn: record.titleEn,
            titleAr: record.titleAr,
            authorEn: record.authorEn || undefined,
            authorAr: record.authorAr || undefined,
            publicationYear: record.publicationYear ? parseInt(record.publicationYear, 10) : undefined,
            publisher: record.publisher || undefined,
            sourceType: record.sourceType as any || undefined,
            url: record.url || undefined,
            pages: record.pages || undefined,
            volume: record.volume || undefined,
            issue: record.issue || undefined,
            isbn: record.isbn || undefined,
            doi: record.doi || undefined,
            notes: record.notes || undefined,
          };

          // Create source
          await this.prisma.source.create({
            data: sourceData,
          });

          created++;
        } catch (error) {
          errors++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errorDetails.push(`Row ${index + 2}: ${errorMessage}`);
          logger.error(`Error importing source at row ${index + 2}:`, error);
        }
      }

      logger.info(`Source CSV import completed: ${created} created, ${errors} errors`);

      return {
        message: 'Source CSV import completed',
        created,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      };
    } catch (error) {
      logger.error('Failed to parse source CSV file:', error);
      throw new Error('Failed to parse CSV file. Please ensure it is properly formatted.');
    }
  }
}
