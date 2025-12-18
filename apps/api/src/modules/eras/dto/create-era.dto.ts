import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEraDto {
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  dateFrom: string;

  @IsString()
  @IsNotEmpty()
  dateTo: string;

  @IsString()
  @IsNotEmpty()
  hijriFrom: string;

  @IsString()
  @IsNotEmpty()
  hijriTo: string;
}
