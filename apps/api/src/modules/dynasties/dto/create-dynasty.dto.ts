import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateDynastyDto {
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @IsInt()
  eraId: number;

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
