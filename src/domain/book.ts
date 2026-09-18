import type { Book, BookStatus } from "../types/Book";

export const STATUS_LABEL: Record<BookStatus, string> = {
  wishlist: "Wishlist",
  "to-read": "To read",
  reading: "Reading",
  finished: "Finished",
};

/** Statuses of books that are part of the library (everything except the wishlist). */
export const LIBRARY_STATUSES: readonly BookStatus[] = ["to-read", "reading", "finished"];

export const BOOK_STATUSES: readonly { value: BookStatus; label: string }[] = (
  ["wishlist", ...LIBRARY_STATUSES] as BookStatus[]
).map((value) => ({ value, label: STATUS_LABEL[value] }));

export const isInLibrary = (book: Pick<Book, "status">) => book.status !== "wishlist";

/** Reading progress in percent (0–100), or null when total pages are unknown. */
export function progressPercent(
  book: Pick<Book, "pagesRead" | "totalPages">
): number | null {
  if (!book.totalPages || book.totalPages <= 0) return null;
  const raw = ((book.pagesRead ?? 0) / book.totalPages) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export interface ProgressInput {
  status: BookStatus;
  totalPages?: number;
  pagesRead?: number;
}

const toPageCount = (value: number | undefined, min: number): number | undefined =>
  value === undefined || !Number.isFinite(value) ? undefined : Math.max(min, Math.floor(value));

/**
 * Turns a progress edit into a consistent book patch:
 * - page counts are whole numbers; pages read never exceed the total
 * - finishing a book with a known length marks every page read
 * - logging pages on a "to read" or wishlist book starts it
 * - startedAt/finishedAt record the reading timeline for later statistics
 */
export function applyProgressUpdate(
  book: Pick<Book, "status" | "startedAt" | "finishedAt">,
  input: ProgressInput,
  now: Date = new Date()
): Pick<Book, "status" | "totalPages" | "pagesRead" | "startedAt" | "finishedAt"> {
  const totalPages = toPageCount(input.totalPages, 1);
  let pagesRead = toPageCount(input.pagesRead, 0);
  let status = input.status;

  if (totalPages !== undefined && pagesRead !== undefined) {
    pagesRead = Math.min(pagesRead, totalPages);
  }
  const notStarted = (s: BookStatus) => s === "to-read" || s === "wishlist";
  if (notStarted(status) && status === book.status && (pagesRead ?? 0) > 0) {
    status = "reading";
  }
  if (status === "finished" && totalPages !== undefined) {
    pagesRead = totalPages;
  }

  const startedAt =
    book.startedAt ?? (status === "reading" || status === "finished" ? now : undefined);
  const finishedAt =
    status === "finished" ? (book.status === "finished" ? book.finishedAt ?? now : now) : undefined;

  return { status, totalPages, pagesRead, startedAt, finishedAt };
}

/** Pages newly read by a progress patch (0 when progress stayed the same or went back). */
export function pagesGained(
  book: Pick<Book, "pagesRead">,
  patch: Pick<Book, "pagesRead">
): number {
  return Math.max(0, (patch.pagesRead ?? 0) - (book.pagesRead ?? 0));
}
