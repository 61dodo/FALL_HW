// src/book.model.ts
export class BookDto {
  id: string;
  title: string;
  writer: string;
  isAvailable: boolean;
  createdDt?: Date; // 선택적 필드
  updatedDt?: Date; // 선택적 필드
}
