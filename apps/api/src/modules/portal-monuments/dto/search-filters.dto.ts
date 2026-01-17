import { IsOptional, IsString, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Helper to transform single values or comma-separated strings to arrays
const toNumberArray = ({ value }: { value: any }) => {
  if (value === undefined || value === null) return undefined;

  let numbers: number[];

  if (Array.isArray(value)) {
    // Already an array, ensure all values are numbers
    numbers = value.map(v => typeof v === 'number' ? v : Number(v));
  } else if (typeof value === 'string') {
    // Handle comma-separated values or single value
    numbers = value.includes(',')
      ? value.split(',').map(v => Number(v.trim()))
      : [Number(value)];
  } else {
    // Single number value
    numbers = [Number(value)];
  }

  // Filter out NaN values
  const validNumbers = numbers.filter(n => !isNaN(n));

  // Return undefined if no valid numbers (treated as parameter not provided)
  return validNumbers.length > 0 ? validNumbers : undefined;
};

export class SearchFiltersDto {
  @ApiProperty({
    description: 'Search keyword',
    example: 'pyramid',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: 'Array of era IDs (can be single value, comma-separated, or array)',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @Transform(toNumberArray)
  @IsArray()
  @IsInt({ each: true })
  eraIds?: number[];

  @ApiProperty({
    description: 'Array of dynasty IDs (can be single value, comma-separated, or array)',
    example: [1],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @Transform(toNumberArray)
  @IsArray()
  @IsInt({ each: true })
  dynastyIds?: number[];

  @ApiProperty({
    description: 'Array of monument type IDs (can be single value, comma-separated, or array)',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @Transform(toNumberArray)
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
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page (0 or omit for all results)',
    example: 12,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  limit?: number;
}
