import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type ActionItem } from "../../types/ActionItem";

const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

export const actionItemConverter: FirestoreDataConverter<ActionItem> = {
  toFirestore(action: ActionItem) {
    return {
      bookId: action.bookId,
      noteId: action.noteId ?? null,
      description: action.description,
      status: action.status,
      githubUrl: action.githubUrl ?? null,
      createdAt: Timestamp.fromDate(action.createdAt),
      completedAt: action.completedAt
        ? Timestamp.fromDate(action.completedAt)
        : null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): ActionItem {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      bookId: data.bookId,
      noteId: data.noteId ?? undefined,
      description: data.description,
      status: data.status,
      githubUrl: data.githubUrl ?? undefined,
      createdAt: toDate(data.createdAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    };
  },
};