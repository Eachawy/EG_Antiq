import { IsInt, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkSourcesToMonumentDto {
  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  monumentId: number;

  @ApiProperty({ description: 'Array of source IDs to link', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  sourceIds: number[];

  @ApiPropertyOptional({ description: 'Starting display order (auto-increments for each source)', example: 0 })
  @IsInt()
  @IsOptional()
  startDisplayOrder?: number;
}
