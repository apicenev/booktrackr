import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type Note } from "../../types/Note";
import { toDate } from "../firestoreUtils";

export const noteConverter: FirestoreDataConverter<Note> = {
  toFirestore(note: Note) {
    return {
      bookId: note.bookId,
      title: note.title,
      content: note.content,
      tags: note.tags ?? [],
      isKeyInsight: note.isKeyInsight ?? false,
      linkedBookIds: note.linkedBookIds ?? [],
      createdAt: Timestamp.fromDate(note.createdAt),
      updatedAt: Timestamp.fromDate(note.updatedAt),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Note {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      bookId: data.bookId,
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      isKeyInsight: data.isKeyInsight ?? false,
      linkedBookIds: data.linkedBookIds ?? [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};
