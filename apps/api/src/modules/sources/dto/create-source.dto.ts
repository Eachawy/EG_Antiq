import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';

export class CreateSourceDto {
  @ApiProperty({ description: 'Title in Arabic', example: 'معابد مصر القديمة' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ description: 'Title in English', example: 'The Complete Temples of Ancient Egypt' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional({ description: 'Author in Arabic', example: 'ريتشارد ويلكينسون' })
  @IsString()
  @IsOptional()
  authorAr?: string;

  @ApiPropertyOptional({ description: 'Author in English', example: 'Richard H. Wilkinson' })
  @IsString()
  @IsOptional()
  authorEn?: string;

  @ApiPropertyOptional({ description: 'Publication year', example: 2000 })
  @IsInt()
  @IsOptional()
  publicationYear?: number;

  @ApiPropertyOptional({ description: 'Publisher', example: 'Thames & Hudson' })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiPropertyOptional({ description: 'Source type', enum: SourceType, example: 'BOOK' })
  @IsEnum(SourceType)
  @IsOptional()
  sourceType?: SourceType;

  @ApiPropertyOptional({ description: 'URL to online source', example: 'https://example.com/source' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Page numbers', example: '45-67' })
  @IsString()
  @IsOptional()
  pages?: string;

  @ApiPropertyOptional({ description: 'Volume number', example: '12' })
  @IsString()
  @IsOptional()
  volume?: string;

  @ApiPropertyOptional({ description: 'Issue number', example: '3' })
  @IsString()
  @IsOptional()
  issue?: string;

  @ApiPropertyOptional({ description: 'ISBN', example: '9780500051009' })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({ description: 'DOI (Digital Object Identifier)', example: '10.1000/xyz123' })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Comprehensive temple guide' })
  @IsString()
  @IsOptional()
  notes?: string;
}
