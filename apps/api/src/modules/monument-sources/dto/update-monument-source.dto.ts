import { PartialType } from '@nestjs/swagger';
import { CreateMonumentSourceDto } from './create-monument-source.dto';

export class UpdateMonumentSourceDto extends PartialType(CreateMonumentSourceDto) {}
