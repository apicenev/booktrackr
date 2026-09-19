import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/firebase", () => {
  return {
    db: { __db: true },
  };
});

type CollectionRef = {
  kind: "collection";
  path: unknown[];
  withConverter: (converter: unknown) => CollectionRef;
};

type DocRef = {
  kind: "doc";
  path: unknown[];
};

const makeCollectionRef = (path: unknown[]): CollectionRef => ({
  kind: "collection",
  path,
  withConverter: () => makeCollectionRef(path),
});

const makeDocRef = (path: unknown[]): DocRef => ({
  kind: "doc",
  path,
});

const firestoreMocks = vi.hoisted(() => {
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    writeBatch: vi.fn(),
  };
});

const batch = vi.hoisted(() => ({
  delete: vi.fn(),
  commit: vi.fn(),
}));

vi.mock("firebase/firestore", () => {
  return {
    collection: firestoreMocks.collection,
    doc: firestoreMocks.doc,
    query: firestoreMocks.query,
    getDocs: firestoreMocks.getDocs,
    getDoc: firestoreMocks.getDoc,
    addDoc: firestoreMocks.addDoc,
    updateDoc: firestoreMocks.updateDoc,
    deleteDoc: firestoreMocks.deleteDoc,
    onSnapshot: firestoreMocks.onSnapshot,
    writeBatch: firestoreMocks.writeBatch,
  };
});

import {
  createBook,
  deleteBook,
  getBook,
  getBooks,
  listenToBooks,
  updateBook,
} from "../../services/bookService";

describe("bookService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.collection.mockImplementation((_db: unknown, ...path: unknown[]) =>
      makeCollectionRef([_db, ...path])
    );

    firestoreMocks.query.mockImplementation((ref: unknown) => ({ kind: "query", ref }));

    firestoreMocks.doc.mockImplementation((a: unknown, ...rest: unknown[]) => {
      if (a && typeof a === "object" && (a as { kind?: string }).kind === "collection") {
        return makeDocRef([a, ...rest]);
      }
      // doc(db, "users", ..., "books", bookId)
      return makeDocRef([a, ...rest]);
    });

    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.addDoc.mockResolvedValue({ id: "new-book-id" });
    firestoreMocks.writeBatch.mockReturnValue(batch);
    batch.commit.mockResolvedValue(undefined);
  });

  describe("getBooks", () => {
    it("returns mapped books (happy path)", async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          { data: () => ({ id: "b1", title: "T1" }) },
          { data: () => ({ id: "b2", title: "T2" }) },
        ],
      });

      const books = await getBooks("u1");

      expect(firestoreMocks.collection).toHaveBeenCalled();
      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.getDocs).toHaveBeenCalled();
      expect(books).toEqual([
        { id: "b1", title: "T1" },
        { id: "b2", title: "T2" },
      ]);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("boom"));

      await expect(getBooks("u1")).rejects.toThrow("boom");
    });
  });

  describe("getBook", () => {
    it("returns book when snapshot exists", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: "b1", title: "T1" }),
      });

      const book = await getBook("u1", "b1");

      expect(firestoreMocks.doc).toHaveBeenCalled();
      expect(firestoreMocks.getDoc).toHaveBeenCalled();
      expect(book).toEqual({ id: "b1", title: "T1" });
    });

    it("returns null when snapshot does not exist", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({ id: "b1", title: "T1" }),
      });

      const book = await getBook("u1", "missing");

      expect(book).toBeNull();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDoc.mockRejectedValue(new Error("nope"));

      await expect(getBook("u1", "b1")).rejects.toThrow("nope");
    });
  });

  describe("createBook", () => {
    it("creates book and defaults status to 'to-read' if missing", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

      const id = await createBook("u1", { title: "T", author: "A" });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.addDoc.mock.calls[0];

      expect(payload).toMatchObject({
        title: "T",
        author: "A",
        status: "to-read",
        id: "",
      });
      expect(payload.createdAt).toBeInstanceOf(Date);
      expect(payload.updatedAt).toBeInstanceOf(Date);

      expect(id).toBe("new-book-id");

      vi.useRealTimers();
    });

    it("keeps provided status if present", async () => {
      const id = await createBook("u1", { title: "T", author: "A", status: "reading" });

      const [, payload] = firestoreMocks.addDoc.mock.calls[0];
      expect(payload.status).toBe("reading");
      expect(payload.startedAt).toBeInstanceOf(Date);
      expect(payload.finishedAt).toBeUndefined();
      expect(id).toBe("new-book-id");
    });

    it("keeps Open Library metadata", async () => {
      await createBook("u1", { title: "T", author: "A", coverId: 42, openLibraryKey: "/works/OL1W" });

      const [, payload] = firestoreMocks.addDoc.mock.calls[0];
      expect(payload).toMatchObject({ coverId: 42, openLibraryKey: "/works/OL1W" });
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.addDoc.mockRejectedValue(new Error("write failed"));

      await expect(createBook("u1", { title: "T", author: "A" })).rejects.toThrow("write failed");
    });
  });

  describe("updateBook", () => {
    it("updates book and always sets updatedAt", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-02T00:00:00.000Z"));

      await updateBook("u1", "b1", { title: "New Title" });

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.updateDoc.mock.calls[0];

      expect(payload).toMatchObject({
        title: "New Title",
      });
      expect(payload.updatedAt).toBeInstanceOf(Date);

      vi.useRealTimers();
    });

    it("sends null instead of undefined so clearing page counts does not throw", async () => {
      await updateBook("u1", "b1", { status: "reading", totalPages: undefined, pagesRead: undefined });

      const [, payload] = firestoreMocks.updateDoc.mock.calls[0];
      expect(payload).toMatchObject({ status: "reading", totalPages: null, pagesRead: null });
      expect(Object.values(payload)).not.toContain(undefined);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.updateDoc.mockRejectedValue(new Error("update failed"));

      await expect(updateBook("u1", "b1", { title: "X" })).rejects.toThrow("update failed");
    });
  });

  describe("deleteBook", () => {
    it("deletes notes, action items and reading sessions together with the book in one batch", async () => {
      const note1 = { ref: makeDocRef(["note-1"]) };
      const note2 = { ref: makeDocRef(["note-2"]) };
      const action = { ref: makeDocRef(["action-1"]) };

      firestoreMocks.getDocs
        .mockResolvedValueOnce({ docs: [note1, note2] }) // notes
        .mockResolvedValueOnce({ docs: [action] }) // actionItems
        .mockResolvedValueOnce({ docs: [] }); // readingSessions

      await deleteBook("u1", "b1");

      const queried = firestoreMocks.collection.mock.calls.map((c) => c.at(-1));
      expect(queried).toEqual(expect.arrayContaining(["notes", "actionItems", "readingSessions"]));

      expect(batch.delete).toHaveBeenCalledTimes(2 + 1 + 0 + 1);
      expect(batch.delete).toHaveBeenNthCalledWith(1, note1.ref);
      // The book document is deleted last.
      const lastRef = batch.delete.mock.calls.at(-1)?.[0] as DocRef;
      expect(lastRef.path.slice(1)).toEqual(["users", "u1", "books", "b1"]);
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it("splits very large deletes into batches of at most 500 writes", async () => {
      const many = Array.from({ length: 600 }, (_, i) => ({ ref: makeDocRef([`note-${i}`]) }));
      firestoreMocks.getDocs
        .mockResolvedValueOnce({ docs: many })
        .mockResolvedValue({ docs: [] });

      await deleteBook("u1", "b1");

      expect(batch.delete).toHaveBeenCalledTimes(601);
      expect(batch.commit).toHaveBeenCalledTimes(2);
    });

    it("propagates errors from the batch commit", async () => {
      firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
      batch.commit.mockRejectedValueOnce(new Error("commit failed"));

      await expect(deleteBook("u1", "b1")).rejects.toThrow("commit failed");
    });

    it("propagates errors from getDocs without deleting anything", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("getDocs failed"));

      await expect(deleteBook("u1", "b1")).rejects.toThrow("getDocs failed");
      expect(batch.commit).not.toHaveBeenCalled();
    });
  });

  describe("listenToBooks", () => {
    it("subscribes and calls callback with mapped docs; returns unsubscribe", () => {
      const unsubscribe = vi.fn();
      firestoreMocks.onSnapshot.mockImplementation((_ref: unknown, cb: (snap: unknown) => void) => {
        cb({
          docs: [
            { data: () => ({ id: "b1" }) },
            { data: () => ({ id: "b2" }) },
          ],
        });
        return unsubscribe;
      });

      const cb = vi.fn();
      const ret = listenToBooks("u1", cb);

      expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith([{ id: "b1" }, { id: "b2" }]);
      expect(ret).toBe(unsubscribe);
    });
  });

});
