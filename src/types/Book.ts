/**
 * "wishlist" = interested but not committed (e.g. not owned yet). Wishlist
 * books live on the Wishlist page; the other statuses make up the Library.
 */
export type BookStatus = "wishlist" | "to-read" | "reading" | "finished";

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
  /** Open Library cover image ID. */
  coverId?: number;
  /** Open Library work key (e.g. "/works/OL17618370W"), used to detect duplicates. */
  openLibraryKey?: string;
  /** Set the first time the book moves to "reading". */
  startedAt?: Date;
  /** Set when the book moves to "finished"; cleared if it moves back. */
  finishedAt?: Date;
}

export interface NewBookInput {
  title: string;
  author: string;
  status?: BookStatus; // default "to-read" if not provided
  totalPages?: number;
  tags?: string[];
  coverId?: number;
  openLibraryKey?: string;
}
