import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MonumentTypesService } from './monument-types.service';
import { CreateMonumentTypeDto } from './dto/create-monument-type.dto';
import { UpdateMonumentTypeDto } from './dto/update-monument-type.dto';

@Controller('monument-types')
export class MonumentTypesController {
  constructor(private readonly monumentTypesService: MonumentTypesService) {}

  @Get()
  async findAll() {
    const types = await this.monumentTypesService.findAll();
    return {
      data: types,
      meta: {
        total: types.length,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const type = await this.monumentTypesService.findOne(id);
    return {
      data: type,
    };
  }

  @Post()
  async create(@Body() createMonumentTypeDto: CreateMonumentTypeDto) {
    const type = await this.monumentTypesService.create(createMonumentTypeDto);
    return {
      data: type,
      message: 'Monument type created successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonumentTypeDto: UpdateMonumentTypeDto,
  ) {
    const type = await this.monumentTypesService.update(id, updateMonumentTypeDto);
    return {
      data: type,
      message: 'Monument type updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentTypesService.remove(id);
    return result;
  }
}
