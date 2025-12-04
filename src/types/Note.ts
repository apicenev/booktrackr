export interface Note {
  id: string;
  bookId: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewNoteInput {
  bookId: string;
  title: string;
  content: string;
  tags?: string[];
}