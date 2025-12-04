export interface ReadingSession {
  id: string;
  bookId: string;
  startedAt: Date;
  endedAt?: Date;
  pagesRead?: number;
  notes?: string;
}

export interface NewReadingSessionInput {
  bookId: string;
  startedAt: Date;
  pagesRead?: number;
  notes?: string;
}