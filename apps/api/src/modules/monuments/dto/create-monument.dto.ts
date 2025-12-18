import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateMonumentDto {
  @IsString()
  @IsNotEmpty()
  monumentNameAr: string;

  @IsString()
  @IsNotEmpty()
  monumentNameEn: string;

  @IsString()
  @IsNotEmpty()
  monumentBiographyAr: string;

  @IsString()
  @IsNotEmpty()
  monumentBiographyEn: string;

  @IsString()
  @IsNotEmpty()
  lat: string;

  @IsString()
  @IsNotEmpty()
  lng: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  mDate: string;

  @IsInt()
  monumentsTypeId: number;

  @IsInt()
  eraId: number;

  @IsInt()
  dynastyId: number;

  @IsString()
  @IsNotEmpty()
  zoom: string;

  @IsString()
  @IsNotEmpty()
  center: string;
}
