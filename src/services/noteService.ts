import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { noteConverter } from "../lib/converters/NoteConverter";
import type { Note, NewNoteInput } from "../types/Note";

const notesCollection = (userId: string, bookId: string) =>
  collection(db, "users", userId, "books", bookId, "notes").withConverter(
    noteConverter
  );

export async function getNotes(
  userId: string,
  bookId: string
): Promise<Note[]> {
  const q = query(notesCollection(userId, bookId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function getNote(
  userId: string,
  bookId: string,
  noteId: string
): Promise<Note | null> {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function createNote(
  userId: string,
  bookId: string,
  input: Omit<NewNoteInput, "bookId">
): Promise<string> {
  const now = new Date();

  const docRef = await addDoc(notesCollection(userId, bookId), {
    bookId, // kept in document for redundancy/search, optional
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    id: ""
  });

  return docRef.id;
}

export async function updateNote(
  userId: string,
  bookId: string,
  noteId: string,
  partial: Partial<Omit<Note, "id" | "createdAt">>
): Promise<void> {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  await updateDoc(docRef, {
    ...partial,
    updatedAt: new Date(),
  });
}

export async function deleteNote(
  userId: string,
  bookId: string,
  noteId: string
): Promise<void> {
  const docRef = doc(notesCollection(userId, bookId), noteId);
  await deleteDoc(docRef);
}
