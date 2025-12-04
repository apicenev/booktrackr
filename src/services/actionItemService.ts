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
import { actionItemConverter } from "../lib/converters/ActionItemConverter";
import { type ActionItem } from "../types/ActionItem";
import { v4 as uuidv4 } from "uuid";

const actionItemsCollection = (userId: string, bookId: string) =>
  collection(db, "users", userId, "books", bookId, "actionItems").withConverter(actionItemConverter);

export const getActionItems = async (
  userId: string,
  bookId: string
): Promise<ActionItem[]> => {
  const q = query(actionItemsCollection(userId, bookId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

export const getActionItem = async (
  userId: string,
  bookId: string,
  actionItemId: string
): Promise<ActionItem | null> => {
  const docRef = doc(actionItemsCollection(userId, bookId), actionItemId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const createActionItem = async (
  userId: string,
  bookId: string,
  payload: Omit<ActionItem, "id" | "createdAt" | "completedAt">
): Promise<void> => {
  await addDoc(actionItemsCollection(userId, bookId), {
    id: uuidv4(),
    ...payload,
    createdAt: new Date(),
  });
};

export const updateActionItem = async (
  userId: string,
  bookId: string,
  actionItemId: string,
  partial: Partial<ActionItem>
): Promise<void> => {
  const docRef = doc(actionItemsCollection(userId, bookId), actionItemId);
  await updateDoc(docRef, {
    ...partial,
  });
};

export const deleteActionItem = async (
  userId: string,
  bookId: string,
  actionItemId: string
): Promise<void> => {
  const docRef = doc(actionItemsCollection(userId, bookId), actionItemId);
  await deleteDoc(docRef);
};