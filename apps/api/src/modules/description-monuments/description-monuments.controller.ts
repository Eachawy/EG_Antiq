import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DescriptionMonumentsService } from './description-monuments.service';
import { CreateDescriptionMonumentDto } from './dto/create-description-monument.dto';
import { UpdateDescriptionMonumentDto } from './dto/update-description-monument.dto';

@Controller('description-monuments')
export class DescriptionMonumentsController {
  constructor(private readonly descriptionMonumentsService: DescriptionMonumentsService) {}

  @Get()
  async findAll() {
    const descriptions = await this.descriptionMonumentsService.findAll();
    return {
      data: descriptions,
      meta: {
        total: descriptions.length,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const description = await this.descriptionMonumentsService.findOne(id);
    return {
      data: description,
    };
  }

  @Post()
  async create(@Body() createDescriptionMonumentDto: CreateDescriptionMonumentDto) {
    const description = await this.descriptionMonumentsService.create(createDescriptionMonumentDto);
    return {
      data: description,
      message: 'Description monument created successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDescriptionMonumentDto: UpdateDescriptionMonumentDto,
  ) {
    const description = await this.descriptionMonumentsService.update(id, updateDescriptionMonumentDto);
    return {
      data: description,
      message: 'Description monument updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.descriptionMonumentsService.remove(id);
    return result;
  }
}
