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
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { noteConverter } from "../lib/converters/NoteConverter";
import { type Note } from "../types/Note";
import { v4 as uuidv4 } from "uuid";

const notesCollection = (userId: string, bookId: string) =>
  collection(db, "users", userId, "books", bookId, "notes").withConverter(noteConverter);

export const getNotes = async (
  userId: string,
  bookId: string
): Promise<Note[]> => {
  const q = query(notesCollection(userId, bookId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getNote = async (
  userId: string,
  bookId: string,
  noteId: string
): Promise<Note | null> => {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const createNote = async (
  userId: string,
  bookId: string,
  payload: Omit<Note, "id" | "createdAt" | "updatedAt">
): Promise<void> => {
  await addDoc(notesCollection(userId, bookId), {
    id: uuidv4(),
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export const updateNote = async (
  userId: string,
  bookId: string,
  noteId: string,
  partial: Partial<Note>
): Promise<void> => {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  await updateDoc(docRef, {
    ...partial,
    updatedAt: new Date(),
  });
};

export const deleteNote = async (
  userId: string,
  bookId: string,
  noteId: string
): Promise<void> => {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  await deleteDoc(docRef);
};