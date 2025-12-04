import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type ReadingSession } from "../../types/ReadingSession";

const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

export const readingSessionConverter: FirestoreDataConverter<ReadingSession> = {
  toFirestore(session: ReadingSession) {
    return {
      bookId: session.bookId,
      startedAt: Timestamp.fromDate(session.startedAt),
      endedAt: session.endedAt ? Timestamp.fromDate(session.endedAt) : null,
      pagesRead: session.pagesRead ?? null,
      notes: session.notes ?? null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): ReadingSession {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      bookId: data.bookId,
      startedAt: toDate(data.startedAt),
      endedAt: data.endedAt ? toDate(data.endedAt) : undefined,
      pagesRead: data.pagesRead ?? undefined,
      notes: data.notes ?? undefined,
    };
  },
};