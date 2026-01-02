import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /**
   * GET /api/v1/books
   * Get all books
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all books (PUBLIC)' })
  @ApiResponse({ status: 200, description: 'Returns list of all books with monument counts' })
  async findAll() {
    const books = await this.booksService.findAll();
    return {
      data: books,
      meta: {
        total: books.length,
      },
    };
  }

  /**
   * GET /api/v1/books/:id
   * Get a single book by ID
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get book by ID (PUBLIC)' })
  @ApiParam({ name: 'id', description: 'Book ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns book details with monument count' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.findOne(id);
    return {
      data: book,
    };
  }

  /**
   * POST /api/v1/books
   * Create a new book
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new book (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createBookDto: CreateBookDto) {
    const book = await this.booksService.create(createBookDto);
    return {
      data: book,
      message: 'Book created successfully',
    };
  }

  /**
   * POST /api/v1/books/import-csv
   * Import books from CSV file
   */
  @Post('import-csv')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import books from CSV file (ADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: titleEn,titleAr,authorEn,authorAr,coverImage,publicationYear,publisher,isbn,pages,description,readUrl,purchaseUrl,language,edition',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV import completed' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid CSV format' })
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }

    const result = await this.booksService.importFromCsv(file);
    return result;
  }

  /**
   * PATCH /api/v1/books/:id
   * Update book by ID
   */
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update book by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Book ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    const book = await this.booksService.update(id, updateBookDto);
    return {
      data: book,
      message: 'Book updated successfully',
    };
  }

  /**
   * DELETE /api/v1/books/:id
   * Delete book by ID
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete book by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Book ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.booksService.remove(id);
    return result;
  }
}
