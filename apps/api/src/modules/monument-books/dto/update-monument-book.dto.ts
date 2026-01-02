import { PartialType } from '@nestjs/swagger';
import { CreateMonumentBookDto } from './create-monument-book.dto';

export class UpdateMonumentBookDto extends PartialType(CreateMonumentBookDto) {}
