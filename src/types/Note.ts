export interface Note {
  id: string;
  bookId: string;
  title: string;
  content: string;
  tags?: string[];
  /** Marks the note as a key insight for the knowledge library. */
  isKeyInsight?: boolean;
  /** Other books this note relates to (links between books). */
  linkedBookIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewNoteInput {
  bookId: string;
  title: string;
  content: string;
  tags?: string[];
  isKeyInsight?: boolean;
  linkedBookIds?: string[];
}
