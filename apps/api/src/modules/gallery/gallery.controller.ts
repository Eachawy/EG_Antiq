import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const gallery = await this.galleryService.findOne(id);
    return {
      data: gallery,
    };
  }

  @Post()
  async create(@Body() createGalleryDto: CreateGalleryDto) {
    const gallery = await this.galleryService.create(createGalleryDto);
    return {
      data: gallery,
      message: 'Gallery item created successfully',
    };
  }

  @Patch(':id')
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.galleryService.remove(id);
    return result;
  }
}
