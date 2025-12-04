// --- Shared primitive types ---

export type BookStatus = "to-read" | "reading" | "finished";
export type ActionStatus = "open" | "done";

// --- UserProfile ---

export interface UserProfile {
  id: string; // Firestore document ID (same as auth uid)
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

// --- Book ---

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

// --- Note ---

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

// --- Action Item ---

export interface ActionItem {
  id: string;
  bookId: string;
  noteId?: string;
  description: string;
  status: ActionStatus;
  githubUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface NewActionItemInput {
  bookId: string;
  noteId?: string;
  description: string;
  githubUrl?: string;
}

// --- Reading Session ---

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