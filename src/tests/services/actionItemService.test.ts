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
  createActionItem,
  deleteActionItem,
  getActionItem,
  getActionItems,
  updateActionItem,
} from "../../services/actionItemService";

describe("actionItemService", () => {
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

  describe("getActionItems", () => {
    it("returns mapped action items (happy path)", async () => {
      firestoreMocks.getDocs.mockResolvedValue({
        docs: [
          { data: () => ({ id: "a1", description: "D1" }) },
          { data: () => ({ id: "a2", description: "D2" }) },
        ],
      });

      const items = await getActionItems("u1", "b1");

      expect(firestoreMocks.collection).toHaveBeenCalled();
      expect(firestoreMocks.query).toHaveBeenCalled();
      expect(firestoreMocks.getDocs).toHaveBeenCalled();
      expect(items).toEqual([
        { id: "a1", description: "D1" },
        { id: "a2", description: "D2" },
      ]);
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDocs.mockRejectedValue(new Error("boom"));

      await expect(getActionItems("u1", "b1")).rejects.toThrow("boom");
    });
  });

  describe("getActionItem", () => {
    it("returns item when snapshot exists", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: "a1", description: "D1" }),
      });

      const item = await getActionItem("u1", "b1", "a1");

      expect(firestoreMocks.doc).toHaveBeenCalled();
      expect(firestoreMocks.getDoc).toHaveBeenCalled();
      expect(item).toEqual({ id: "a1", description: "D1" });
    });

    it("returns null when snapshot does not exist", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({ id: "a1", description: "D1" }),
      });

      const item = await getActionItem("u1", "b1", "missing");
      expect(item).toBeNull();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDoc.mockRejectedValue(new Error("nope"));

      await expect(getActionItem("u1", "b1", "a1")).rejects.toThrow("nope");
    });
  });

  describe("createActionItem", () => {
    it("creates action item with deterministic uuid and createdAt", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-03T00:00:00.000Z"));

      await createActionItem("u1", "b1", {
        bookId: "b1",
        description: "Do thing",
        status: "open",
      });

      expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.addDoc.mock.calls[0];

      expect(payload).toMatchObject({
        id: "fixed-uuid",
        bookId: "b1",
        description: "Do thing",
        status: "open",
      });
      expect(payload.createdAt).toBeInstanceOf(Date);

      vi.useRealTimers();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.addDoc.mockRejectedValue(new Error("write failed"));

      await expect(
        createActionItem("u1", "b1", {
          bookId: "b1",
          description: "Do thing",
          status: "open",
        })
      ).rejects.toThrow("write failed");
    });
  });

  describe("updateActionItem", () => {
    it("updates action item with partial payload", async () => {
      await updateActionItem("u1", "b1", "a1", { status: "done" });

      expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
      const [, payload] = firestoreMocks.updateDoc.mock.calls[0];

      expect(payload).toEqual({ status: "done" });
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.updateDoc.mockRejectedValue(new Error("update failed"));

      await expect(updateActionItem("u1", "b1", "a1", { status: "done" })).rejects.toThrow(
        "update failed"
      );
    });
  });

  describe("deleteActionItem", () => {
    it("deletes action item doc", async () => {
      await deleteActionItem("u1", "b1", "a1");

      expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.doc).toHaveBeenCalled();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.deleteDoc.mockRejectedValue(new Error("delete failed"));

      await expect(deleteActionItem("u1", "b1", "a1")).rejects.toThrow("delete failed");
    });
  });
});