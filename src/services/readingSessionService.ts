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
import { readingSessionConverter } from "../lib/converters/ReadingSessionConverter";
import { type ReadingSession } from "../types/ReadingSession";
import { v4 as uuidv4 } from "uuid";

const readingSessionsCollection = (userId: string, bookId: string) =>
  collection(db, "users", userId, "books", bookId, "readingSessions").withConverter(readingSessionConverter);

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

export const createReadingSession = async (
  userId: string,
  bookId: string,
  payload: Omit<ReadingSession, "id">
): Promise<void> => {
  await addDoc(readingSessionsCollection(userId, bookId), {
    id: uuidv4(),
    ...payload,
    startedAt: new Date(),
  });
};

export const updateReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string,
  partial: Partial<ReadingSession>
): Promise<void> => {
  const docRef = doc(readingSessionsCollection(userId, bookId), sessionId);
  await updateDoc(docRef, {
    ...partial,
  });
};

export const deleteReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string
): Promise<void> => {
  const docRef = doc(readingSessionsCollection(userId, bookId), sessionId);
  await deleteDoc(docRef);
};