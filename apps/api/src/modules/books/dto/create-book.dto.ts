import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ description: 'Title in Arabic', example: 'العمارة المصرية القديمة' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ description: 'Title in English', example: 'Ancient Egyptian Architecture' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiProperty({ description: 'Author in Arabic', example: 'ديتر أرنولد' })
  @IsString()
  @IsNotEmpty()
  authorAr: string;

  @ApiProperty({ description: 'Author in English', example: 'Dieter Arnold' })
  @IsString()
  @IsNotEmpty()
  authorEn: string;

  @ApiPropertyOptional({ description: 'Cover image path', example: 'uploads/books/cover-123.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Publication year', example: 1991 })
  @IsInt()
  @IsOptional()
  publicationYear?: number;

  @ApiPropertyOptional({ description: 'Publisher', example: 'Oxford University Press' })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiPropertyOptional({ description: 'ISBN', example: '9780195036336' })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Number of pages', example: 320 })
  @IsInt()
  @IsOptional()
  pages?: number;

  @ApiPropertyOptional({ description: 'Book description', example: 'Comprehensive study of Egyptian architecture' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL to read the book online', example: 'https://archive.org/example' })
  @IsString()
  @IsOptional()
  readUrl?: string;

  @ApiPropertyOptional({ description: 'URL to purchase the book', example: 'https://amazon.com/example' })
  @IsString()
  @IsOptional()
  purchaseUrl?: string;

  @ApiPropertyOptional({ description: 'Book language', example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Book edition', example: '1st' })
  @IsString()
  @IsOptional()
  edition?: string;
}
