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
  set: vi.fn(),
  update: vi.fn(),
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
  createReadingSession,
  deleteReadingSessionAndRevert,
  listenToReadingSessions,
  saveProgress,
  deleteReadingSession,
  getReadingSession,
  getReadingSessions,
  updateReadingSession,
} from "../../services/readingSessionService";

describe("readingSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.collection.mockImplementation((_db: unknown, ...path: unknown[]) =>
      makeCollectionRef([_db, ...path])
    );

    firestoreMocks.writeBatch.mockReturnValue(batch);
    batch.commit.mockResolvedValue(undefined);

    firestoreMocks.query.mockImplementation((ref: unknown) => ({ kind: "query", ref }));

    firestoreMocks.doc.mockImplementation((a: unknown, ...rest: unknown[]) => {
      if (a && typeof a === "object" && (a as { kind?: string }).kind === "collection") {
        return makeDocRef([a, ...rest]);
      }
      return makeDocRef([a, ...rest]);
    });

    firestoreMocks.addDoc.mockResolvedValue({ id: "firestore-doc-id" });
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
  });

  describe("getReadingSessions", () => {
    it("returns mapped sessions (happy path)", async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          { data: () => ({ id: "s1", pagesRead: 10 }) },
          { data: () => ({ id: "s2", pagesRead: 5 }) },
        ],
      });

      const sessions = await getReadingSessions("u1", "b1");

      expect(firestoreMocks.collection).toHaveBeenCalled();
      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.getDocs).toHaveBeenCalled();
      expect(sessions).toEqual([
        { id: "s1", pagesRead: 10 },
        { id: "s2", pagesRead: 5 },
      ]);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("boom"));

      await expect(getReadingSessions("u1", "b1")).rejects.toThrow("boom");
    });
  });

  describe("getReadingSession", () => {
    it("returns session when snapshot exists", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: "s1", pagesRead: 10 }),
      });

      const session = await getReadingSession("u1", "b1", "s1");

      expect(firestoreMocks.doc).toHaveBeenCalled();
      expect(firestoreMocks.getDoc).toHaveBeenCalled();
      expect(session).toEqual({ id: "s1", pagesRead: 10 });
    });

    it("returns null when snapshot does not exist", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({ id: "s1" }),
      });

      const session = await getReadingSession("u1", "b1", "missing");
      expect(session).toBeNull();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDoc.mockRejectedValue(new Error("nope"));

      await expect(getReadingSession("u1", "b1", "s1")).rejects.toThrow("nope");
    });
  });

  describe("createReadingSession", () => {
    it("creates a session for the book in the path, keeping the given startedAt", async () => {
      await createReadingSession("u1", "b1", {
        startedAt: new Date("2000-01-01T00:00:00.000Z"),
        pagesRead: 12,
        notes: "hello",
      });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.addDoc.mock.calls[0];

      expect(payload).toMatchObject({
        bookId: "b1",
        pagesRead: 12,
        notes: "hello",
      });
      expect((payload.startedAt as Date).toISOString()).toBe("2000-01-01T00:00:00.000Z");
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.addDoc.mockRejectedValue(new Error("write failed"));

      await expect(
        createReadingSession("u1", "b1", { startedAt: new Date() })
      ).rejects.toThrow("write failed");
    });
  });

  describe("updateReadingSession", () => {
    it("updates session with partial payload", async () => {
      await updateReadingSession("u1", "b1", "s1", { endedAt: new Date(), pagesRead: 99 });

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.updateDoc.mock.calls[0];

      expect(payload).toMatchObject({ pagesRead: 99 });
      expect(payload.endedAt).toBeInstanceOf(Date);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.updateDoc.mockRejectedValue(new Error("update failed"));

      await expect(updateReadingSession("u1", "b1", "s1", { pagesRead: 1 })).rejects.toThrow(
        "update failed"
      );
    });
  });

  describe("deleteReadingSession", () => {
    it("deletes session doc", async () => {
      await deleteReadingSession("u1", "b1", "s1");

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.doc).toHaveBeenCalled();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.deleteDoc.mockRejectedValue(new Error("delete failed"));

      await expect(deleteReadingSession("u1", "b1", "s1")).rejects.toThrow("delete failed");
    });
  });

  describe("saveProgress", () => {
    const NOW = new Date("2026-05-01T08:00:00.000Z");
    const book = { id: "b1", pagesRead: 40 };
    const bookPath = (ref: DocRef) => ref.path.slice(1);

    it("updates the book and records the gained pages as a session in one batch", async () => {
      await saveProgress("u1", book, { status: "reading", pagesRead: 65 }, NOW);

      expect(batch.update).toHaveBeenCalledTimes(1);
      const [bookRef, patch] = batch.update.mock.calls[0];
      expect(bookPath(bookRef)).toEqual(["users", "u1", "books", "b1"]);
      expect(patch).toEqual({ status: "reading", pagesRead: 65, updatedAt: NOW });

      expect(batch.set).toHaveBeenCalledTimes(1);
      expect(batch.set.mock.calls[0][1]).toMatchObject({ bookId: "b1", startedAt: NOW, pagesRead: 25 });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it("records no session when no pages were gained", async () => {
      await saveProgress("u1", book, { status: "finished" }, NOW);
      await saveProgress("u1", book, { pagesRead: 30 }, NOW);

      expect(batch.update).toHaveBeenCalledTimes(2);
      expect(batch.set).not.toHaveBeenCalled();
    });

    it("clears optional fields with null instead of undefined", async () => {
      await saveProgress("u1", book, { totalPages: undefined, finishedAt: undefined }, NOW);

      const [, patch] = batch.update.mock.calls[0];
      expect(patch).toMatchObject({ totalPages: null, finishedAt: null });
    });

    it("propagates commit errors", async () => {
      batch.commit.mockRejectedValueOnce(new Error("offline"));
      await expect(saveProgress("u1", book, { pagesRead: 50 }, NOW)).rejects.toThrow("offline");
    });
  });

  describe("deleteReadingSessionAndRevert", () => {
    it("deletes the session and takes its pages off the book", async () => {
      await deleteReadingSessionAndRevert("u1", { id: "b1", pagesRead: 40 }, { id: "s1", pagesRead: 15 });

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.update.mock.calls[0][1]).toMatchObject({ pagesRead: 25 });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it("never takes progress below zero", async () => {
      await deleteReadingSessionAndRevert("u1", { id: "b1", pagesRead: 5 }, { id: "s1", pagesRead: 15 });
      expect(batch.update.mock.calls[0][1]).toMatchObject({ pagesRead: 0 });
    });
  });

  describe("listenToReadingSessions", () => {
    it("emits mapped sessions and forwards errors", () => {
      const unsubscribe = vi.fn();
      firestoreMocks.onSnapshot.mockImplementation((_ref: unknown, cb: (snap: unknown) => void) => {
        cb({ docs: [{ data: () => ({ id: "s1" }) }] });
        return unsubscribe;
      });
      const cb = vi.fn();
      const onError = vi.fn();

      const ret = listenToReadingSessions("u1", "b1", cb, onError);

      expect(cb).toHaveBeenCalledWith([{ id: "s1" }]);
      expect(firestoreMocks.onSnapshot.mock.calls[0][2]).toBe(onError);
      expect(ret).toBe(unsubscribe);
    });
  });
});
