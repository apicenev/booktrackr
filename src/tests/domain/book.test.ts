import { describe, expect, it } from "vitest";
import { applyProgressUpdate, progressPercent } from "../../domain/book";

const NOW = new Date("2026-03-01T10:00:00.000Z");
const EARLIER = new Date("2026-01-15T10:00:00.000Z");

describe("progressPercent", () => {
  it("is null when total pages are unknown", () => {
    expect(progressPercent({ pagesRead: 10 })).toBeNull();
    expect(progressPercent({ pagesRead: 10, totalPages: 0 })).toBeNull();
  });

  it("is 0 (not null) when nothing has been read yet", () => {
    expect(progressPercent({ totalPages: 200 })).toBe(0);
    expect(progressPercent({ pagesRead: 0, totalPages: 200 })).toBe(0);
  });

  it("rounds and clamps to 0-100", () => {
    expect(progressPercent({ pagesRead: 1, totalPages: 3 })).toBe(33);
    expect(progressPercent({ pagesRead: 500, totalPages: 200 })).toBe(100);
  });
});

describe("applyProgressUpdate", () => {
  it("allows saving a status change without any page counts", () => {
    const patch = applyProgressUpdate({ status: "to-read" }, { status: "reading" }, NOW);
    expect(patch).toEqual({
      status: "reading",
      totalPages: undefined,
      pagesRead: undefined,
      startedAt: NOW,
      finishedAt: undefined,
    });
  });

  it("clamps pages read to the total and normalises page counts", () => {
    const patch = applyProgressUpdate(
      { status: "reading", startedAt: EARLIER },
      { status: "reading", totalPages: 300.7, pagesRead: 450 },
      NOW
    );
    expect(patch.totalPages).toBe(300);
    expect(patch.pagesRead).toBe(300);
    expect(patch.startedAt).toBe(EARLIER);
  });

  it("never stores negative or invalid page counts", () => {
    const patch = applyProgressUpdate(
      { status: "reading" },
      { status: "reading", totalPages: Number.NaN, pagesRead: -5 },
      NOW
    );
    expect(patch.totalPages).toBeUndefined();
    expect(patch.pagesRead).toBe(0);
  });

  it("starts a to-read book when pages are logged", () => {
    const patch = applyProgressUpdate({ status: "to-read" }, { status: "to-read", pagesRead: 12 }, NOW);
    expect(patch.status).toBe("reading");
    expect(patch.startedAt).toBe(NOW);
  });

  it("respects an explicit move back to to-read", () => {
    const patch = applyProgressUpdate(
      { status: "reading", startedAt: EARLIER },
      { status: "to-read", pagesRead: 12 },
      NOW
    );
    expect(patch.status).toBe("to-read");
  });

  it("marks every page read and records finishedAt when finishing", () => {
    const patch = applyProgressUpdate(
      { status: "reading", startedAt: EARLIER },
      { status: "finished", totalPages: 320, pagesRead: 290 },
      NOW
    );
    expect(patch.pagesRead).toBe(320);
    expect(patch.finishedAt).toBe(NOW);
    expect(patch.startedAt).toBe(EARLIER);
  });

  it("keeps the original finishedAt when re-saving a finished book", () => {
    const patch = applyProgressUpdate(
      { status: "finished", startedAt: EARLIER, finishedAt: EARLIER },
      { status: "finished", totalPages: 320 },
      NOW
    );
    expect(patch.finishedAt).toBe(EARLIER);
  });

  it("does not invent a finish date when re-saving a finished book without one", () => {
    const patch = applyProgressUpdate(
      { status: "finished", startedAt: EARLIER },
      { status: "finished", totalPages: 320 },
      NOW
    );
    expect(patch.finishedAt).toBeUndefined();
  });

  it("clears finishedAt when a finished book is reopened", () => {
    const patch = applyProgressUpdate(
      { status: "finished", startedAt: EARLIER, finishedAt: EARLIER },
      { status: "reading", totalPages: 320, pagesRead: 100 },
      NOW
    );
    expect(patch.finishedAt).toBeUndefined();
  });
});
