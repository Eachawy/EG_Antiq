import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { NotFoundError } from '../../common/errors/base.error';
import { CreateMonumentBookDto } from './dto/create-monument-book.dto';
import { UpdateMonumentBookDto } from './dto/update-monument-book.dto';
import { LinkBooksToMonumentDto } from './dto/link-books-to-monument.dto';

@Injectable()
export class MonumentBooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.monumentBook.findMany({
      include: {
        monument: {
          select: { id: true, monumentNameEn: true, monumentNameAr: true },
        },
        book: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const link = await this.prisma.monumentBook.findUnique({
      where: { id },
      include: {
        monument: {
          select: { id: true, monumentNameEn: true, monumentNameAr: true },
        },
        book: true,
      },
    });

    if (!link) {
      throw new NotFoundError('Monument-Book link', id.toString());
    }

    return link;
  }

  async findByMonumentId(monumentId: number) {
    return this.prisma.monumentBook.findMany({
      where: { monumentId },
      include: { book: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(createDto: CreateMonumentBookDto) {
    const monument = await this.prisma.monument.findUnique({
      where: { id: createDto.monumentId },
    });
    if (!monument) {
      throw new NotFoundError('Monument', createDto.monumentId.toString());
    }

    const book = await this.prisma.book.findUnique({
      where: { id: createDto.bookId },
    });
    if (!book) {
      throw new NotFoundError('Book', createDto.bookId.toString());
    }

    return this.prisma.monumentBook.create({
      data: createDto,
      include: {
        monument: {
          select: { id: true, monumentNameEn: true, monumentNameAr: true },
        },
        book: true,
      },
    });
  }

  async bulkLinkToMonument(dto: LinkBooksToMonumentDto) {
    return this.prisma.$transaction(async (tx) => {
      const monument = await tx.monument.findUnique({
        where: { id: dto.monumentId },
      });
      if (!monument) {
        throw new NotFoundError('Monument', dto.monumentId.toString());
      }

      const books = await tx.book.findMany({
        where: { id: { in: dto.bookIds } },
      });
      if (books.length !== dto.bookIds.length) {
        throw new BadRequestException('One or more books not found');
      }

      const links = await Promise.all(
        dto.bookIds.map((bookId, index) =>
          tx.monumentBook.create({
            data: {
              monumentId: dto.monumentId,
              bookId,
              displayOrder: (dto.startDisplayOrder || 0) + index,
            },
            include: { book: true },
          })
        )
      );

      return {
        message: `Successfully linked ${links.length} books to monument`,
        data: links,
      };
    });
  }

  async update(id: number, updateDto: UpdateMonumentBookDto) {
    await this.findOne(id);

    if (updateDto.monumentId) {
      const monument = await this.prisma.monument.findUnique({
        where: { id: updateDto.monumentId },
      });
      if (!monument) {
        throw new NotFoundError('Monument', updateDto.monumentId.toString());
      }
    }

    if (updateDto.bookId) {
      const book = await this.prisma.book.findUnique({
        where: { id: updateDto.bookId },
      });
      if (!book) {
        throw new NotFoundError('Book', updateDto.bookId.toString());
      }
    }

    return this.prisma.monumentBook.update({
      where: { id },
      data: updateDto,
      include: {
        monument: {
          select: { id: true, monumentNameEn: true, monumentNameAr: true },
        },
        book: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.monumentBook.delete({ where: { id } });
    return { message: 'Monument-Book link deleted successfully' };
  }

  async removeByMonumentAndBook(monumentId: number, bookId: number) {
    const link = await this.prisma.monumentBook.findFirst({
      where: { monumentId, bookId },
    });

    if (!link) {
      throw new NotFoundError(
        'Monument-Book link',
        `monumentId=${monumentId}, bookId=${bookId}`
      );
    }

    await this.prisma.monumentBook.delete({ where: { id: link.id } });
    return { message: 'Monument-Book link deleted successfully' };
  }
}
