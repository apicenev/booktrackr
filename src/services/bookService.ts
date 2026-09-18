import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  onSnapshot,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { bookConverter } from "../lib/converters/BookConverter";
import { toUpdateData } from "../lib/firestoreUtils";
import type { Book, NewBookInput } from "../types/Book";

// Every subcollection stored under a book document. Keep in sync with the
// services that own them so deleting a book never leaves orphaned data.
const BOOK_SUBCOLLECTIONS = ["notes", "actionItems", "readingSessions"] as const;
const MAX_BATCH_WRITES = 500;

const booksCollection = (userId: string) =>
  collection(db, "users", userId, "books").withConverter(bookConverter);

export async function getBooks(userId: string): Promise<Book[]> {
  const q = query(booksCollection(userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getBook(
  userId: string,
  bookId: string
): Promise<Book | null> {
  const docRef = doc(booksCollection(userId), bookId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function createBook(
  userId: string,
  input: NewBookInput
): Promise<string> {
  const now = new Date();
  const status = input.status ?? "to-read";

  const docRef = await addDoc(booksCollection(userId), {
    ...input,
    status,
    createdAt: now,
    updatedAt: now,
    startedAt: status === "reading" ? now : undefined,
    finishedAt: status === "finished" ? now : undefined,
    id: "", // ignored by the converter; Firestore assigns the id
  });

  return docRef.id;
}

export async function updateBook(
  userId: string,
  bookId: string,
  partial: Partial<Omit<Book, "id" | "createdAt">>
): Promise<void> {
  const docRef = doc(booksCollection(userId), bookId);

  await updateDoc(docRef, {
    ...toUpdateData(partial),
    updatedAt: new Date(),
  });
}

/**
 * Deletes a book together with its notes, action items and reading sessions.
 * Writes are batched so a failure never leaves a half-deleted book behind
 * (for books with fewer than 500 related documents).
 */
export async function deleteBook(
  userId: string,
  bookId: string
): Promise<void> {
  const snapshots = await Promise.all(
    BOOK_SUBCOLLECTIONS.map((name) =>
      getDocs(collection(db, "users", userId, "books", bookId, name))
    )
  );

  const refs: DocumentReference[] = snapshots.flatMap((s) => s.docs.map((d) => d.ref));
  // The book itself goes last so it only disappears once its children are gone.
  refs.push(doc(db, "users", userId, "books", bookId));

  for (let i = 0; i < refs.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    refs.slice(i, i + MAX_BATCH_WRITES).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export function listenToBooks(
  userId: string,
  callback: (books: Book[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    booksCollection(userId),
    (snapshot) => callback(snapshot.docs.map((doc) => doc.data())),
    onError
  );
}
