import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type Book } from "../../types/Book";

const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

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
    };
  },
};