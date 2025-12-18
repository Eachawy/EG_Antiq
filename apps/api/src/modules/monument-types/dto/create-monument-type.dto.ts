import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMonumentTypeDto {
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  nameEn: string;
}
