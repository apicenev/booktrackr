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
  };
});

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
  };
});

import {
  cascadeDeleteBook,
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
      if (a && typeof a === "object" && (a as any).kind === "collection") {
        return makeDocRef([a, ...rest]);
      }
      // doc(db, "users", ..., "books", bookId)
      return makeDocRef([a, ...rest]);
    });

    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.addDoc.mockResolvedValue({ id: "new-book-id" });
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
      expect(id).toBe("new-book-id");
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

    it("propagates firestore errors", async () => {
      firestoreMocks.updateDoc.mockRejectedValue(new Error("update failed"));

      await expect(updateBook("u1", "b1", { title: "X" })).rejects.toThrow("update failed");
    });
  });

  describe("deleteBook", () => {
    it("deletes the book doc", async () => {
      await deleteBook("u1", "b1");

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.doc).toHaveBeenCalled();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.deleteDoc.mockRejectedValue(new Error("delete failed"));

      await expect(deleteBook("u1", "b1")).rejects.toThrow("delete failed");
    });
  });

  describe("listenToBooks", () => {
    it("subscribes and calls callback with mapped docs; returns unsubscribe", () => {
      const unsubscribe = vi.fn();
      firestoreMocks.onSnapshot.mockImplementation((_ref: unknown, cb: (snap: any) => void) => {
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

  describe("cascadeDeleteBook", () => {
    it("deletes notes/actionItems/readingSessions docs then deletes the book doc", async () => {
      const noteDocRef1 = { ref: makeDocRef(["note-1"]) };
      const noteDocRef2 = { ref: makeDocRef(["note-2"]) };
      const actionDocRef = { ref: makeDocRef(["action-1"]) };

      firestoreMocks.getDocs
        .mockResolvedValueOnce({ docs: [noteDocRef1, noteDocRef2] }) // notes
        .mockResolvedValueOnce({ docs: [actionDocRef] }) // actionItems
        .mockResolvedValueOnce({ docs: [] }); // readingSessions

      await cascadeDeleteBook("u1", "b1");

      // deleteDoc called for each subcollection doc + final book doc
      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(2 + 1 + 0 + 1);

      // final delete: doc(db, "users", userId, "books", bookId)
      const lastCallArg = firestoreMocks.deleteDoc.mock.calls.at(-1)?.[0] as DocRef;
      expect(lastCallArg.kind).toBe("doc");
    });

    it("propagates errors if deleting a subcollection fails", async () => {
      firestoreMocks.getDocs.mockResolvedValueOnce({
        docs: [{ ref: makeDocRef(["note-1"]) }],
      });

      firestoreMocks.deleteDoc.mockRejectedValueOnce(new Error("sub-delete failed"));

      await expect(cascadeDeleteBook("u1", "b1")).rejects.toThrow("sub-delete failed");
    });

    it("propagates errors from getDocs", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("getDocs failed"));

      await expect(cascadeDeleteBook("u1", "b1")).rejects.toThrow("getDocs failed");
    });
  });
});