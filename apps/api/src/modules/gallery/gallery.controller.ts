import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@ApiTags('Gallery')
@ApiBearerAuth('JWT-auth')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all gallery items' })
  @ApiResponse({ status: 200, description: 'Returns list of all gallery items' })
  async findAll() {
    const gallery = await this.galleryService.findAll();
    return {
      data: gallery,
      meta: {
        total: gallery.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gallery item by ID' })
  @ApiParam({ name: 'id', description: 'Gallery item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns gallery item details' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const gallery = await this.galleryService.findOne(id);
    return {
      data: gallery,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new gallery item' })
  @ApiResponse({ status: 201, description: 'Gallery item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createGalleryDto: CreateGalleryDto) {
    const gallery = await this.galleryService.create(createGalleryDto);
    return {
      data: gallery,
      message: 'Gallery item created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update gallery item by ID' })
  @ApiParam({ name: 'id', description: 'Gallery item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Gallery item updated successfully' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ) {
    const gallery = await this.galleryService.update(id, updateGalleryDto);
    return {
      data: gallery,
      message: 'Gallery item updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete gallery item by ID' })
  @ApiParam({ name: 'id', description: 'Gallery item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Gallery item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.galleryService.remove(id);
    return result;
  }
}
