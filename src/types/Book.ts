export type BookStatus = "to-read" | "reading" | "finished";

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  totalPages?: number;
  pagesRead?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewBookInput {
  title: string;
  author: string;
  status?: BookStatus; // default "to-read" if not provided
  totalPages?: number;
  tags?: string[];
}