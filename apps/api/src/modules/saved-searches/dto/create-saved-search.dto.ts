import { IsString, IsOptional, IsArray, IsInt, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSavedSearchDto {
  @ApiProperty({
    description: 'Name for this saved search',
    example: 'Pyramids of Giza',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Search keyword',
    example: 'pyramid',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: 'Array of era IDs',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  eraIds?: number[];

  @ApiProperty({
    description: 'Array of dynasty IDs',
    example: [1],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  dynastyIds?: number[];

  @ApiProperty({
    description: 'Array of monument type IDs',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  monumentTypeIds?: number[];

  @ApiProperty({
    description: 'Date from (string)',
    example: '-2500',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Date to (string)',
    example: '-2000',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Additional filters as JSON',
    example: { location: 'Cairo' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}
