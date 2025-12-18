import { IsInt } from 'class-validator';

export class CreateMonumentEraDto {
  @IsInt()
  eraId: number;

  @IsInt()
  monumentsTypeId: number;
}
