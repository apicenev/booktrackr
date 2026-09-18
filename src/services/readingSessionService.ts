import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { readingSessionConverter } from "../lib/converters/ReadingSessionConverter";
import { toUpdateData } from "../lib/firestoreUtils";
import { pagesGained } from "../domain/book";
import type { Book } from "../types/Book";
import type { NewReadingSessionInput, ReadingSession } from "../types/ReadingSession";

const readingSessionsCollection = (userId: string, bookId: string) =>
  collection(db, "users", userId, "books", bookId, "readingSessions").withConverter(readingSessionConverter);

const bookDoc = (userId: string, bookId: string) => doc(db, "users", userId, "books", bookId);

export const getReadingSessions = async (
  userId: string,
  bookId: string
): Promise<ReadingSession[]> => {
  const q = query(readingSessionsCollection(userId, bookId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string
): Promise<ReadingSession | null> => {
  const docRef = doc(readingSessionsCollection(userId, bookId), sessionId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const listenToReadingSessions = (
  userId: string,
  bookId: string,
  callback: (sessions: ReadingSession[]) => void,
  onError?: (error: Error) => void
) =>
  onSnapshot(
    readingSessionsCollection(userId, bookId),
    (snapshot) => callback(snapshot.docs.map((doc) => doc.data())),
    onError
  );

export const createReadingSession = async (
  userId: string,
  bookId: string,
  input: Omit<NewReadingSessionInput, "bookId">
): Promise<string> => {
  const docRef = await addDoc(readingSessionsCollection(userId, bookId), {
    id: "", // ignored by the converter; Firestore assigns the id
    bookId,
    startedAt: input.startedAt,
    pagesRead: input.pagesRead,
    notes: input.notes,
  });
  return docRef.id;
};

/**
 * Saves a progress patch for a book. When pages were gained, a reading
 * session with the page delta is recorded in the same atomic batch, so the
 * reading history (streaks, pace, pages per month) never drifts from the book.
 */
export const saveProgress = async (
  userId: string,
  book: Pick<Book, "id" | "pagesRead">,
  patch: Partial<Omit<Book, "id" | "createdAt">>,
  now: Date = new Date()
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(bookDoc(userId, book.id), { ...toUpdateData(patch), updatedAt: now });

  const gained = "pagesRead" in patch ? pagesGained(book, patch) : 0;
  if (gained > 0) {
    batch.set(doc(readingSessionsCollection(userId, book.id)), {
      id: "", // ignored by the converter; Firestore assigns the id
      bookId: book.id,
      startedAt: now,
      pagesRead: gained,
    });
  }

  await batch.commit();
};

export const updateReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string,
  partial: Partial<Omit<ReadingSession, "id" | "bookId">>
): Promise<void> => {
  const docRef = doc(readingSessionsCollection(userId, bookId), sessionId);
  await updateDoc(docRef, toUpdateData(partial));
};

export const deleteReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string
): Promise<void> => {
  const docRef = doc(readingSessionsCollection(userId, bookId), sessionId);
  await deleteDoc(docRef);
};

/** Removes a logged session and takes its pages back off the book (e.g. a mis-tap). */
export const deleteReadingSessionAndRevert = async (
  userId: string,
  book: Pick<Book, "id" | "pagesRead">,
  session: Pick<ReadingSession, "id" | "pagesRead">,
  now: Date = new Date()
): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(doc(readingSessionsCollection(userId, book.id), session.id));
  if (session.pagesRead) {
    batch.update(bookDoc(userId, book.id), {
      pagesRead: Math.max(0, (book.pagesRead ?? 0) - session.pagesRead),
      updatedAt: now,
    });
  }
  await batch.commit();
};
