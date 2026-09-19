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
import { actionItemConverter } from "../lib/converters/ActionItemConverter";
import { toUpdateData } from "../lib/firestoreUtils";
import type { ActionItem, NewActionItemInput } from "../types/ActionItem";

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

export const listenToActionItems = (
  userId: string,
  bookId: string,
  callback: (items: ActionItem[]) => void,
  onError?: (error: Error) => void
) =>
  onSnapshot(
    actionItemsCollection(userId, bookId),
    (snapshot) => callback(snapshot.docs.map((doc) => doc.data())),
    onError
  );

export const createActionItem = async (
  userId: string,
  bookId: string,
  input: Omit<NewActionItemInput, "bookId">
): Promise<string> => {
  const docRef = await addDoc(actionItemsCollection(userId, bookId), {
    id: "", // ignored by the converter; Firestore assigns the id
    bookId,
    noteId: input.noteId,
    description: input.description,
    githubUrl: input.githubUrl,
    status: "open",
    createdAt: new Date(),
  });
  return docRef.id;
};

export const updateActionItem = async (
  userId: string,
  bookId: string,
  actionItemId: string,
  partial: Partial<Omit<ActionItem, "id" | "bookId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(actionItemsCollection(userId, bookId), actionItemId);
  await updateDoc(docRef, toUpdateData(partial));
};

export const deleteActionItem = async (
  userId: string,
  bookId: string,
  actionItemId: string
): Promise<void> => {
  const docRef = doc(actionItemsCollection(userId, bookId), actionItemId);
  await deleteDoc(docRef);
};
