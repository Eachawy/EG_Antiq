import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MonumentBooksService } from './monument-books.service';
import { CreateMonumentBookDto } from './dto/create-monument-book.dto';
import { UpdateMonumentBookDto } from './dto/update-monument-book.dto';
import { LinkBooksToMonumentDto } from './dto/link-books-to-monument.dto';

@ApiTags('Monument Books')
@ApiBearerAuth('JWT-auth')
@Controller('monument-books')
export class MonumentBooksController {
  constructor(private readonly monumentBooksService: MonumentBooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all monument-book links' })
  @ApiResponse({ status: 200, description: 'Returns list of all monument-book links' })
  async findAll() {
    const links = await this.monumentBooksService.findAll();
    return { data: links, meta: { total: links.length } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monument-book link by ID' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns monument-book link details' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const link = await this.monumentBooksService.findOne(id);
    return { data: link };
  }

  @Get('monument/:monumentId')
  @ApiOperation({ summary: 'Get all books for a monument' })
  @ApiParam({ name: 'monumentId', description: 'Monument ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns list of books for the monument' })
  async findByMonument(@Param('monumentId', ParseIntPipe) monumentId: number) {
    const books = await this.monumentBooksService.findByMonumentId(monumentId);
    return { data: books, meta: { total: books.length } };
  }

  @Post()
  @ApiOperation({ summary: 'Link a book to a monument' })
  @ApiResponse({ status: 201, description: 'Monument-book link created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Monument or book not found' })
  async create(@Body() createDto: CreateMonumentBookDto) {
    const link = await this.monumentBooksService.create(createDto);
    return { data: link, message: 'Monument-book link created successfully' };
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk link multiple books to a monument' })
  @ApiResponse({ status: 201, description: 'Books linked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Monument or one or more books not found' })
  async bulkLink(@Body() dto: LinkBooksToMonumentDto) {
    const result = await this.monumentBooksService.bulkLinkToMonument(dto);
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update monument-book link' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-book link updated successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMonumentBookDto,
  ) {
    const link = await this.monumentBooksService.update(id, updateDto);
    return { data: link, message: 'Monument-book link updated successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument-book link by ID' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-book link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentBooksService.remove(id);
    return result;
  }

  @Delete('monument/:monumentId/book/:bookId')
  @ApiOperation({ summary: 'Delete monument-book link by monument and book IDs' })
  @ApiParam({ name: 'monumentId', description: 'Monument ID', example: 1 })
  @ApiParam({ name: 'bookId', description: 'Book ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-book link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async removeByIds(
    @Param('monumentId', ParseIntPipe) monumentId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
  ) {
    const result = await this.monumentBooksService.removeByMonumentAndBook(monumentId, bookId);
    return result;
  }
}
