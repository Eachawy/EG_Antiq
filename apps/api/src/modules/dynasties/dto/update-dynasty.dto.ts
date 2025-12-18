import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateDynastyDto {
  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsInt()
  @IsOptional()
  eraId?: number;

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
