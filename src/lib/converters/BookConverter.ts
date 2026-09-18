import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type Book } from "../../types/Book";
import { toDate } from "../firestoreUtils";

export const bookConverter: FirestoreDataConverter<Book> = {
  toFirestore(book: Book) {
    return {
      title: book.title,
      author: book.author,
      status: book.status,
      totalPages: book.totalPages ?? null,
      pagesRead: book.pagesRead ?? null,
      tags: book.tags ?? [],
      createdAt: Timestamp.fromDate(book.createdAt),
      updatedAt: Timestamp.fromDate(book.updatedAt),
      coverId: book.coverId ?? null,
      openLibraryKey: book.openLibraryKey ?? null,
      startedAt: book.startedAt ? Timestamp.fromDate(book.startedAt) : null,
      finishedAt: book.finishedAt ? Timestamp.fromDate(book.finishedAt) : null,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Book {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      title: data.title,
      author: data.author,
      status: data.status,
      totalPages: data.totalPages ?? undefined,
      pagesRead: data.pagesRead ?? undefined,
      tags: data.tags ?? [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      coverId: data.coverId ?? undefined,
      openLibraryKey: data.openLibraryKey ?? undefined,
      startedAt: data.startedAt ? toDate(data.startedAt) : undefined,
      finishedAt: data.finishedAt ? toDate(data.finishedAt) : undefined,
    };
  },
};
