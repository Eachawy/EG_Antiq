import { IsInt, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkBooksToMonumentDto {
  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  monumentId: number;

  @ApiProperty({ description: 'Array of book IDs to link', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  bookIds: number[];

  @ApiPropertyOptional({ description: 'Starting display order (auto-increments for each book)', example: 0 })
  @IsInt()
  @IsOptional()
  startDisplayOrder?: number;
}
