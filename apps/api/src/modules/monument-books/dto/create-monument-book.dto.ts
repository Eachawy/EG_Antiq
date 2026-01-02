import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonumentBookDto {
  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  monumentId: number;

  @ApiProperty({ description: 'Book ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  bookId: number;

  @ApiPropertyOptional({ description: 'Relevance of this book to the monument', example: 'Primary reference for architectural details' })
  @IsString()
  @IsOptional()
  relevance?: string;

  @ApiPropertyOptional({ description: 'Display order on portal', example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
