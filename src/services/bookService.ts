import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { bookConverter } from "../lib/converters/BookConverter";
import { type Book } from "../types/Book";
import { v4 as uuidv4 } from "uuid";

const booksCollection = (userId: string) =>
  collection(db, "users", userId, "books").withConverter(bookConverter);

export const getBooks = async (userId: string): Promise<Book[]> => {
  const q = query(booksCollection(userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getBook = async (
  userId: string,
  bookId: string
): Promise<Book | null> => {
  const docRef = doc(booksCollection(userId), bookId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const createBook = async (
  userId: string,
  payload: Omit<Book, "id" | "createdAt" | "updatedAt">
): Promise<void> => {
  await addDoc(booksCollection(userId), {
    id: uuidv4(),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateBook = async (
  userId: string,
  bookId: string,
  partial: Partial<Book>
): Promise<void> => {
  const docRef = doc(booksCollection(userId), bookId);
  await updateDoc(docRef, {
    ...partial,
    updatedAt: new Date(),
  });
};

export const deleteBook = async (
  userId: string,
  bookId: string
): Promise<void> => {
  const docRef = doc(booksCollection(userId), bookId);
  await deleteDoc(docRef);
};

export const listenToBooks = (userId: string, callback: (books: any[]) => void) => {
  const booksRef = collection(db, "users", userId, "books");
  return onSnapshot(booksRef, (snapshot) => {
    const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(books);
  });
};

export const cascadeDeleteBook = async (userId: string, bookId: string) => {
  const notesRef = collection(db, "users", userId, "books", bookId, "notes");
  const actionItemsRef = collection(db, "users", userId, "books", bookId, "actionItems");

  const deleteCollection = async (ref: any) => {
    const snapshot = await getDocs(ref);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  };

  await deleteCollection(notesRef);
  await deleteCollection(actionItemsRef);
  await deleteDoc(doc(db, "users", userId, "books", bookId));
};