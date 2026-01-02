import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { parse } from 'csv-parse/sync';
import { logger } from '../../logger';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all books with monument count
   */
  async findAll() {
    return this.prisma.book.findMany({
      include: {
        _count: {
          select: {
            monumentBooks: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single book by ID with monument count
   */
  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            monumentBooks: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundError('Book', id.toString());
    }

    return book;
  }

  /**
   * Create a new book
   */
  async create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: createBookDto,
    });
  }

  /**
   * Update a book
   */
  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
      data: updateBookDto,
    });
  }

  /**
   * Delete a book
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.book.delete({
      where: { id },
    });

    return { message: 'Book deleted successfully' };
  }

  /**
   * Import books from CSV file
   * CSV columns: titleEn,titleAr,authorEn,authorAr,coverImage,publicationYear,publisher,isbn,pages,description,readUrl,purchaseUrl,language,edition
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

      logger.info(`Starting book CSV import with ${records.length} records`);

      for (const [index, record] of records.entries()) {
        try {
          // Validate required fields
          if (!record.titleEn || !record.titleAr) {
            throw new Error('Book title (English and Arabic) is required');
          }
          if (!record.authorEn || !record.authorAr) {
            throw new Error('Book author (English and Arabic) is required');
          }

          // Prepare book data
          const bookData: any = {
            titleEn: record.titleEn,
            titleAr: record.titleAr,
            authorEn: record.authorEn,
            authorAr: record.authorAr,
            coverImage: record.coverImage || undefined,
            publicationYear: record.publicationYear ? parseInt(record.publicationYear, 10) : undefined,
            publisher: record.publisher || undefined,
            isbn: record.isbn || undefined,
            pages: record.pages ? parseInt(record.pages, 10) : undefined,
            description: record.description || undefined,
            readUrl: record.readUrl || undefined,
            purchaseUrl: record.purchaseUrl || undefined,
            language: record.language || undefined,
            edition: record.edition || undefined,
          };

          // Create book
          await this.prisma.book.create({
            data: bookData,
          });

          created++;
        } catch (error) {
          errors++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errorDetails.push(`Row ${index + 2}: ${errorMessage}`);
          logger.error(`Error importing book at row ${index + 2}:`, error);
        }
      }

      logger.info(`Book CSV import completed: ${created} created, ${errors} errors`);

      return {
        message: 'Book CSV import completed',
        created,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      };
    } catch (error) {
      logger.error('Failed to parse book CSV file:', error);
      throw new Error('Failed to parse CSV file. Please ensure it is properly formatted.');
    }
  }
}
