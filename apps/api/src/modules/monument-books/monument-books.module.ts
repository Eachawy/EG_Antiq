import { Module } from '@nestjs/common';
import { MonumentBooksService } from './monument-books.service';
import { MonumentBooksController } from './monument-books.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MonumentBooksController],
  providers: [MonumentBooksService, PrismaService],
  exports: [MonumentBooksService],
})
export class MonumentBooksModule {}
