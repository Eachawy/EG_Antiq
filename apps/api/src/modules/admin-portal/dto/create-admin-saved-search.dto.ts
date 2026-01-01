import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAdminSavedSearchDto {
  @ApiProperty({
    description: 'Portal user ID',
    example: 'uuid-here',
  })
  @IsNotEmpty()
  @IsString()
  portalUserId: string;

  @ApiProperty({
    description: 'Name of the saved search',
    example: 'My favorite monuments',
  })
  @IsNotEmpty()
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
  @Type(() => Number)
  eraIds?: number[];

  @ApiProperty({
    description: 'Array of dynasty IDs',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  dynastyIds?: number[];

  @ApiProperty({
    description: 'Array of monument type IDs',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  monumentTypeIds?: number[];

  @ApiProperty({
    description: 'Date from filter',
    example: '2000 BC',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Date to filter',
    example: '1000 BC',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Additional filters as JSON',
    example: { location: 'Giza' },
    required: false,
  })
  @IsOptional()
  filters?: any;

  @ApiProperty({
    description: 'Result count',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  resultCount?: number;
}
