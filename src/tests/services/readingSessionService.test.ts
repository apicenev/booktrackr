import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/firebase", () => {
  return {
    db: { __db: true },
  };
});

vi.mock("uuid", () => {
  return {
    v4: vi.fn(() => "fixed-uuid"),
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
  };
});

import {
  createReadingSession,
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

    firestoreMocks.query.mockImplementation((ref: unknown) => ({ kind: "query", ref }));

    firestoreMocks.doc.mockImplementation((a: unknown, ...rest: unknown[]) => {
      if (a && typeof a === "object" && (a as any).kind === "collection") {
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
    it("creates session with deterministic uuid and overrides startedAt to now", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-04-04T00:00:00.000Z"));

      await createReadingSession("u1", "b1", {
        bookId: "b1",
        startedAt: new Date("2000-01-01T00:00:00.000Z"),
        pagesRead: 12,
        notes: "hello",
      });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.addDoc.mock.calls[0];

      expect(payload).toMatchObject({
        id: "fixed-uuid",
        bookId: "b1",
        pagesRead: 12,
        notes: "hello",
      });

      // service overwrites startedAt with new Date()
      expect(payload.startedAt).toBeInstanceOf(Date);
      expect((payload.startedAt as Date).toISOString()).toBe("2024-04-04T00:00:00.000Z");

      vi.useRealTimers();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.addDoc.mockRejectedValue(new Error("write failed"));

      await expect(
        createReadingSession("u1", "b1", {
          bookId: "b1",
          startedAt: new Date(),
        })
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
});