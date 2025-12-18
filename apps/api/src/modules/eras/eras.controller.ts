import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ErasService } from './eras.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';

@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Get()
  async findAll() {
    const eras = await this.erasService.findAll();
    return {
      data: eras,
      meta: {
        total: eras.length,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const era = await this.erasService.findOne(id);
    return {
      data: era,
    };
  }

  @Post()
  async create(@Body() createEraDto: CreateEraDto) {
    const era = await this.erasService.create(createEraDto);
    return {
      data: era,
      message: 'Era created successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEraDto: UpdateEraDto,
  ) {
    const era = await this.erasService.update(id, updateEraDto);
    return {
      data: era,
      message: 'Era updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.erasService.remove(id);
    return result;
  }
}
