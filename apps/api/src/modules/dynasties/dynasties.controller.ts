import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DynastiesService } from './dynasties.service';
import { CreateDynastyDto } from './dto/create-dynasty.dto';
import { UpdateDynastyDto } from './dto/update-dynasty.dto';

@Controller('dynasties')
export class DynastiesController {
  constructor(private readonly dynastiesService: DynastiesService) {}

  @Get()
  async findAll() {
    const dynasties = await this.dynastiesService.findAll();
    return {
      data: dynasties,
      meta: {
        total: dynasties.length,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const dynasty = await this.dynastiesService.findOne(id);
    return {
      data: dynasty,
    };
  }

  @Post()
  async create(@Body() createDynastyDto: CreateDynastyDto) {
    const dynasty = await this.dynastiesService.create(createDynastyDto);
    return {
      data: dynasty,
      message: 'Dynasty created successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDynastyDto: UpdateDynastyDto,
  ) {
    const dynasty = await this.dynastiesService.update(id, updateDynastyDto);
    return {
      data: dynasty,
      message: 'Dynasty updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dynastiesService.remove(id);
    return result;
  }
}
