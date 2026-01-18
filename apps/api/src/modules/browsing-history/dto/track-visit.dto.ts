import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TrackVisitDto {
  @ApiProperty({
    description: 'Monument ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  monumentId: number;

  @ApiProperty({
    description: 'Duration of visit in seconds',
    example: 120,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationSeconds?: number;
}
