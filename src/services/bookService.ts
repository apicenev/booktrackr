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
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { bookConverter } from "../lib/converters/BookConverter";
import type { Book, NewBookInput } from "../types/Book";

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

  const docRef = await addDoc(booksCollection(userId), {
    ...input,
    status: input.status ?? "to-read",
    createdAt: now,
    updatedAt: now,
    id: ""
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
    ...partial,
    updatedAt: new Date(),
  });
}

export async function deleteBook(
  userId: string,
  bookId: string
): Promise<void> {
  const docRef = doc(booksCollection(userId), bookId);
  await deleteDoc(docRef);
}

export function listenToBooks(
  userId: string,
  callback: (books: Book[]) => void
) {
  return onSnapshot(booksCollection(userId), (snapshot) => {
    const books = snapshot.docs.map((doc) => doc.data());
    callback(books);
  });
}

/**
 * Deletes a book and all related subcollections:
 * - notes
 * - actionItems
 * - readingSessions
 */
export async function cascadeDeleteBook(
  userId: string,
  bookId: string
): Promise<void> {
  const notesRef = collection(db, "users", userId, "books", bookId, "notes");
  const actionItemsRef = collection(
    db,
    "users",
    userId,
    "books",
    bookId,
    "actionItems"
  );
  const readingSessionsRef = collection(
    db,
    "users",
    userId,
    "books",
    bookId,
    "readingSessions"
  );

  const deleteCollection = async (ref: typeof notesRef) => {
    const snapshot = await getDocs(ref);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  };

  await deleteCollection(notesRef);
  await deleteCollection(actionItemsRef);
  await deleteCollection(readingSessionsRef);
  await deleteDoc(doc(db, "users", userId, "books", bookId));
}
