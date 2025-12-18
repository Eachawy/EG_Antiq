import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MonumentsEraService } from './monuments-era.service';
import { CreateMonumentEraDto } from './dto/create-monument-era.dto';
import { UpdateMonumentEraDto } from './dto/update-monument-era.dto';

@Controller('monuments-era')
export class MonumentsEraController {
  constructor(private readonly monumentsEraService: MonumentsEraService) {}

  @Get()
  async findAll() {
    const monumentsEra = await this.monumentsEraService.findAll();
    return {
      data: monumentsEra,
      meta: {
        total: monumentsEra.length,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const monumentEra = await this.monumentsEraService.findOne(id);
    return {
      data: monumentEra,
    };
  }

  @Post()
  async create(@Body() createMonumentEraDto: CreateMonumentEraDto) {
    const monumentEra = await this.monumentsEraService.create(createMonumentEraDto);
    return {
      data: monumentEra,
      message: 'Monument-era relationship created successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonumentEraDto: UpdateMonumentEraDto,
  ) {
    const monumentEra = await this.monumentsEraService.update(id, updateMonumentEraDto);
    return {
      data: monumentEra,
      message: 'Monument-era relationship updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentsEraService.remove(id);
    return result;
  }
}
