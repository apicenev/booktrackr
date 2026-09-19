import {
  collection,
  deleteField,
  doc,
  getDocs,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Book } from "../types/Book";

const MAX_BATCH_WRITES = 500;

type Write =
  | { kind: "delete"; ref: DocumentReference }
  | { kind: "clearDates"; ref: DocumentReference };

/**
 * Resets everything the Stats page is computed from, so statistics start
 * fresh: deletes all reading sessions, clears startedAt/finishedAt on every
 * book and removes the yearly goals. Books keep their status and page
 * progress; notes and action items are untouched.
 *
 * Writes are batched (atomic up to 500 writes). If a later batch fails, the
 * reset is partial but can simply be run again.
 */
export async function resetStatistics(
  userId: string,
  books: Pick<Book, "id" | "startedAt" | "finishedAt">[]
): Promise<void> {
  const sessionSnapshots = await Promise.all(
    books.map((b) => getDocs(collection(db, "users", userId, "books", b.id, "readingSessions")))
  );

  const writes: Write[] = [
    ...sessionSnapshots.flatMap((s) => s.docs.map((d) => ({ kind: "delete" as const, ref: d.ref }))),
    ...books
      .filter((b) => b.startedAt || b.finishedAt)
      .map((b) => ({ kind: "clearDates" as const, ref: doc(db, "users", userId, "books", b.id) })),
  ];

  for (let i = 0; i < writes.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    for (const w of writes.slice(i, i + MAX_BATCH_WRITES)) {
      if (w.kind === "delete") batch.delete(w.ref);
      // updatedAt is left alone on purpose so the library order doesn't change.
      else batch.update(w.ref, { startedAt: null, finishedAt: null });
    }
    await batch.commit();
  }

  // Merge + deleteField also works when the profile document doesn't exist yet.
  const goalsBatch = writeBatch(db);
  goalsBatch.set(doc(db, "users", userId), { yearlyGoals: deleteField() }, { merge: true });
  await goalsBatch.commit();
}
