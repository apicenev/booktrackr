import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import {
  type UserProfile,
  type Book,
  type Note,
  type ActionItem,
  type ReadingSession,
} from "../../types";

// Helper to safely convert Firestore Timestamp or Date to Date
const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

// --- UserProfile converter ---

export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(user: UserProfile) {
    return {
      email: user.email,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: Timestamp.fromDate(user.createdAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      email: data.email,
      displayName: data.displayName ?? undefined,
      photoURL: data.photoURL ?? undefined,
      createdAt: toDate(data.createdAt),
    };
  },
};

// --- Book converter ---

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

// --- Note converter ---

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

// --- ActionItem converter ---

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

// --- ReadingSession converter ---

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