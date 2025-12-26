import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackVisitDto {
  @ApiProperty({
    description: 'Monument ID',
    example: 1,
  })
  @IsInt()
  monumentId: number;

  @ApiProperty({
    description: 'Duration of visit in seconds',
    example: 120,
    required: false,
  })
  @IsOptional()
  @IsInt()
  durationSeconds?: number;
}
