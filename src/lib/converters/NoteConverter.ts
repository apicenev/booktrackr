import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type Note } from "../../types/Note";

const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

export const noteConverter: FirestoreDataConverter<Note> = {
  toFirestore(note: Note) {
    return {
      bookId: note.bookId,
      title: note.title,
      content: note.content,
      tags: note.tags ?? [],
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
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  },
};