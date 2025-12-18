import { IsString, IsOptional } from 'class-validator';

export class UpdateMonumentTypeDto {
  @IsString()
  @IsOptional()
  nameAr?: string;

  @IsString()
  @IsOptional()
  nameEn?: string;
}
