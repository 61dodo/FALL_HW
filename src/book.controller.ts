// src/book.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BookService } from './book.service';
import { BookDto } from './book.model';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  createBook(@Body() bookDto: BookDto): BookDto {
    return this.bookService.createBook(bookDto);
  }

  @Get()
  findAllBooks(): BookDto[] {
    return this.bookService.findAllBooks();
  }

  @Put(':id')
  updateBook(@Param('id') id: string, @Body() bookDto: BookDto): BookDto {
    return this.bookService.updateBook(id, bookDto);
  }

  @Delete(':id')
  deleteBook(@Param('id') id: string): void {
    this.bookService.deleteBook(id);
  }
}
