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
  createNote,
  deleteNote,
  getNote,
  getNotes,
  updateNote,
} from "../../services/noteService";

describe("noteService", () => {
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

    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.addDoc.mockResolvedValue({ id: "new-note-id" });
  });

  describe("getNotes", () => {
    it("returns mapped notes (happy path)", async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          { data: () => ({ id: "n1", title: "T1" }) },
          { data: () => ({ id: "n2", title: "T2" }) },
        ],
      });

      const notes = await getNotes("u1", "b1");

      expect(firestoreMocks.collection).toHaveBeenCalled();
      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.getDocs).toHaveBeenCalled();
      expect(notes).toEqual([
        { id: "n1", title: "T1" },
        { id: "n2", title: "T2" },
      ]);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("boom"));

      await expect(getNotes("u1", "b1")).rejects.toThrow("boom");
    });
  });

  describe("getNote", () => {
    it("returns note when snapshot exists", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: "n1", title: "T1" }),
      });

      const note = await getNote("u1", "b1", "n1");

      expect(firestoreMocks.doc).toHaveBeenCalled();
      expect(firestoreMocks.getDoc).toHaveBeenCalled();
      expect(note).toEqual({ id: "n1", title: "T1" });
    });

    it("returns null when snapshot does not exist", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({ id: "n1", title: "T1" }),
      });

      const note = await getNote("u1", "b1", "missing");
      expect(note).toBeNull();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDoc.mockRejectedValue(new Error("nope"));

      await expect(getNote("u1", "b1", "n1")).rejects.toThrow("nope");
    });
  });

  describe("createNote", () => {
    it("creates a note, defaults tags to [], and returns new id", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

      const id = await createNote("u1", "b1", { title: "T", content: "C" });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.addDoc.mock.calls[0];

      expect(payload).toMatchObject({
        bookId: "b1",
        title: "T",
        content: "C",
        tags: [],
        id: "",
      });
      expect(payload.createdAt).toBeInstanceOf(Date);
      expect(payload.updatedAt).toBeInstanceOf(Date);

      expect(id).toBe("new-note-id");

      vi.useRealTimers();
    });

    it("uses provided tags if present", async () => {
      await createNote("u1", "b1", { title: "T", content: "C", tags: ["x"] });

      const [, payload] = firestoreMocks.addDoc.mock.calls[0];
      expect(payload.tags).toEqual(["x"]);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.addDoc.mockRejectedValue(new Error("write failed"));

      await expect(createNote("u1", "b1", { title: "T", content: "C" })).rejects.toThrow(
        "write failed"
      );
    });
  });

  describe("updateNote", () => {
    it("updates note and always sets updatedAt", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-02T00:00:00.000Z"));

      await updateNote("u1", "b1", "n1", { title: "New Title" });

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

      await expect(updateNote("u1", "b1", "n1", { title: "X" })).rejects.toThrow("update failed");
    });
  });

  describe("deleteNote", () => {
    it("deletes the note doc", async () => {
      await deleteNote("u1", "b1", "n1");

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.doc).toHaveBeenCalled();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.deleteDoc.mockRejectedValue(new Error("delete failed"));

      await expect(deleteNote("u1", "b1", "n1")).rejects.toThrow("delete failed");
    });
  });
});