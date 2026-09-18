import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Unsubscribe } from "firebase/firestore";
import { listenToBooks } from "../../services/bookService";
import { listenToNotes } from "../../services/noteService";
import { listenToActionItems } from "../../services/actionItemService";
import { listenToReadingSessions } from "../../services/readingSessionService";
import type { Book } from "../../types/Book";
import type { Note } from "../../types/Note";
import type { ActionItem } from "../../types/ActionItem";
import type { ReadingSession } from "../../types/ReadingSession";
import { LibraryContext, type BookDetails, type LibraryData } from "./useLibrary";

interface PerBook {
  notes?: Note[];
  actionItems?: ActionItem[];
  sessions?: ReadingSession[];
}

const EMPTY_DETAILS: BookDetails = { notes: [], actionItems: [], sessions: [], loaded: false };

/**
 * Keeps the signed-in user's whole library live: one listener for the book
 * list plus notes/action items/sessions listeners per book. Notes and friends
 * live in per-book subcollections, so cross-book features (dashboard, stats,
 * knowledge library, search, backlinks) read from here instead of issuing
 * their own queries. Each document is read once per session, then only changes
 * are streamed. Scales comfortably to a few hundred books.
 *
 * Must be remounted per user (see AppLayout: key={uid}).
 */
export function LibraryProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [perBook, setPerBook] = useState<Record<string, PerBook>>({});
  const [error, setError] = useState<string | null>(null);
  const subscriptions = useRef(new Map<string, Unsubscribe[]>());

  useEffect(() => {
    const onError = (err: Error) => {
      console.error("Library listener failed", err);
      setError("Could not load your library. Please refresh the page.");
    };
    return listenToBooks(uid, setBooks, onError);
  }, [uid]);

  // Subscribe to newly added books and drop listeners of deleted ones,
  // without touching the listeners of unchanged books.
  const bookIdsKey = books?.map((b) => b.id).sort().join(",") ?? null;
  useEffect(() => {
    if (bookIdsKey === null) return;
    const ids = new Set(bookIdsKey ? bookIdsKey.split(",") : []);
    const subs = subscriptions.current;

    const onError = (err: Error) => {
      console.error("Library listener failed", err);
      setError("Could not load your library. Please refresh the page.");
    };
    // Old action items were stored with bookId "", so the parent id is authoritative.
    const store =
      <K extends keyof PerBook>(bookId: string, key: K) =>
      (items: NonNullable<PerBook[K]>) =>
        setPerBook((prev) => ({
          ...prev,
          [bookId]: { ...prev[bookId], [key]: items.map((item) => ({ ...item, bookId })) },
        }));

    for (const [id, unsubscribers] of subs) {
      if (!ids.has(id)) {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        subs.delete(id);
      }
    }
    for (const id of ids) {
      if (subs.has(id)) continue;
      subs.set(id, [
        listenToNotes(uid, id, store(id, "notes"), onError),
        listenToActionItems(uid, id, store(id, "actionItems"), onError),
        listenToReadingSessions(uid, id, store(id, "sessions"), onError),
      ]);
    }
  }, [uid, bookIdsKey]);

  useEffect(() => {
    const subs = subscriptions.current;
    return () => {
      subs.forEach((unsubscribers) => unsubscribers.forEach((unsubscribe) => unsubscribe()));
      subs.clear();
    };
  }, []);

  const value = useMemo<LibraryData>(() => {
    const list = books ?? [];
    const byId = new Map(list.map((b) => [b.id, b]));
    // Ignore data of books that were deleted in the meantime.
    const current = list.map((b) => perBook[b.id] ?? {});
    const detailsFor = (bookId: string): BookDetails => {
      const d = byId.has(bookId) ? perBook[bookId] : undefined;
      if (!d) return EMPTY_DETAILS;
      return {
        notes: d.notes ?? [],
        actionItems: d.actionItems ?? [],
        sessions: d.sessions ?? [],
        loaded: Boolean(d.notes && d.actionItems && d.sessions),
      };
    };

    return {
      books: list,
      booksLoaded: books !== null,
      notes: current.flatMap((d) => d.notes ?? []),
      actionItems: current.flatMap((d) => d.actionItems ?? []),
      sessions: current.flatMap((d) => d.sessions ?? []),
      detailsLoaded: books !== null && current.every((d) => d.notes && d.actionItems && d.sessions),
      error,
      getBook: (bookId) => byId.get(bookId),
      detailsFor,
    };
  }, [books, perBook, error]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
