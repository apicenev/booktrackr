import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/firebase", () => ({ db: { __db: true } }));

type Ref = { path: string };

const firestore = vi.hoisted(() => ({
  collection: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join("/") })),
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ path: path.join("/") })),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  deleteField: vi.fn(() => "__deleteField__"),
}));
vi.mock("firebase/firestore", () => firestore);

// Every writeBatch() call gets its own recorder so batches can be inspected.
const batches: { deletes: Ref[]; updates: [Ref, unknown][]; sets: [Ref, unknown, unknown][]; commit: ReturnType<typeof vi.fn> }[] = [];

import { resetStatistics } from "../../services/statsService";

const sessionsOf = (bookId: string, count: number) => ({
  docs: Array.from({ length: count }, (_, i) => ({
    ref: { path: `users/u1/books/${bookId}/readingSessions/s${i}` },
  })),
});

describe("resetStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batches.length = 0;
    firestore.writeBatch.mockImplementation(() => {
      const b = {
        deletes: [] as Ref[],
        updates: [] as [Ref, unknown][],
        sets: [] as [Ref, unknown, unknown][],
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(b);
      return {
        delete: (ref: Ref) => b.deletes.push(ref),
        update: (ref: Ref, data: unknown) => b.updates.push([ref, data]),
        set: (ref: Ref, data: unknown, options: unknown) => b.sets.push([ref, data, options]),
        commit: b.commit,
      };
    });
  });

  it("deletes all sessions, clears book dates and removes the yearly goals", async () => {
    firestore.getDocs.mockImplementation(async (ref: Ref) =>
      ref.path.includes("/b1/") ? sessionsOf("b1", 2) : sessionsOf("b2", 1)
    );

    await resetStatistics("u1", [
      { id: "b1", startedAt: new Date(), finishedAt: new Date() },
      { id: "b2" }, // no dates: no pointless write
    ]);

    const all = batches.flatMap((b) => b.deletes.map((r) => r.path));
    expect(all).toEqual([
      "users/u1/books/b1/readingSessions/s0",
      "users/u1/books/b1/readingSessions/s1",
      "users/u1/books/b2/readingSessions/s0",
    ]);

    const updates = batches.flatMap((b) => b.updates);
    expect(updates).toEqual([[{ path: "users/u1/books/b1" }, { startedAt: null, finishedAt: null }]]);

    const goals = batches.flatMap((b) => b.sets);
    expect(goals).toEqual([[{ path: "users/u1" }, { yearlyGoals: "__deleteField__" }, { merge: true }]]);
    expect(batches.every((b) => b.commit.mock.calls.length === 1)).toBe(true);
  });

  it("splits large resets into batches of at most 500 writes", async () => {
    firestore.getDocs.mockResolvedValue(sessionsOf("b1", 700));

    await resetStatistics("u1", [{ id: "b1", finishedAt: new Date() }]);

    const writeCounts = batches.map((b) => b.deletes.length + b.updates.length + b.sets.length);
    expect(writeCounts).toEqual([500, 201, 1]);
  });

  it("propagates errors and stops before removing goals", async () => {
    firestore.getDocs.mockResolvedValue(sessionsOf("b1", 1));
    firestore.writeBatch.mockImplementationOnce(() => ({
      delete: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
      commit: vi.fn().mockRejectedValue(new Error("permission-denied")),
    }));

    await expect(resetStatistics("u1", [{ id: "b1" }])).rejects.toThrow("permission-denied");
    expect(firestore.writeBatch).toHaveBeenCalledTimes(1);
  });
});
