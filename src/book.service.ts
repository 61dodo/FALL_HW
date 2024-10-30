// src/book.service.ts
import { Injectable } from '@nestjs/common';
import { BookDto } from './book.model';

@Injectable()
export class BookService {
  private books: BookDto[] = [];

  createBook(book: BookDto): BookDto {
    // createdDt가 없으면 현재 시간으로 설정
    book.createdDt = book.createdDt ?? new Date();
    this.books.push(book);
    return book;
  }

  findAllBooks(): BookDto[] {
    return this.books;
  }

  updateBook(id: string, bookDto: BookDto): BookDto {
    const bookIndex = this.books.findIndex((book) => book.id === id);
    if (bookIndex === -1) return null;

    // 업데이트할 때마다 updatedDt 갱신
    bookDto.updatedDt = new Date();
    this.books[bookIndex] = { ...this.books[bookIndex], ...bookDto };
    return this.books[bookIndex];
  }

  deleteBook(id: string): void {
    this.books = this.books.filter((book) => book.id !== id);
  }
}
