import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonumentSourceDto {
  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  monumentId: number;

  @ApiProperty({ description: 'Source ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sourceId: number;

  @ApiPropertyOptional({ description: 'Specific page numbers in the source', example: '45-67' })
  @IsString()
  @IsOptional()
  pageNumbers?: string;

  @ApiPropertyOptional({ description: 'Additional notes about this relationship', example: 'Primary source for construction dates' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Display order on portal', example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
