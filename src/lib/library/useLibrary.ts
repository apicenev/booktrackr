import { createContext, useContext } from "react";
import type { Book } from "../../types/Book";
import type { Note } from "../../types/Note";
import type { ActionItem } from "../../types/ActionItem";
import type { ReadingSession } from "../../types/ReadingSession";

export interface BookDetails {
  notes: Note[];
  actionItems: ActionItem[];
  sessions: ReadingSession[];
  /** True once this book's notes, action items and sessions have all loaded. */
  loaded: boolean;
}

export interface LibraryData {
  /** All of the user's books, wishlist included. */
  books: Book[];
  booksLoaded: boolean;
  /** Flattened across all books. Each item's bookId is its parent book's id. */
  notes: Note[];
  actionItems: ActionItem[];
  sessions: ReadingSession[];
  /** True once every book's notes, action items and sessions have loaded. */
  detailsLoaded: boolean;
  error: string | null;
  getBook: (bookId: string) => Book | undefined;
  detailsFor: (bookId: string) => BookDetails;
}

export const LibraryContext = createContext<LibraryData | null>(null);

/** The signed-in user's library, kept live by LibraryProvider. */
export const useLibrary = (): LibraryData => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};
