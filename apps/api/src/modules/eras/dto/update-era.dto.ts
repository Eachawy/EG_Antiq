import { IsString, IsOptional } from 'class-validator';

export class UpdateEraDto {
  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  hijriFrom?: string;

  @IsString()
  @IsOptional()
  hijriTo?: string;
}
