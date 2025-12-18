import { IsInt, IsOptional } from 'class-validator';

export class UpdateMonumentEraDto {
  @IsInt()
  @IsOptional()
  eraId?: number;

  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;
}
