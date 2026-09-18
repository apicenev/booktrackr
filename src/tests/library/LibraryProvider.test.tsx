import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../../types/Book";

vi.mock("../../lib/firebase", () => ({ db: {}, auth: {} }));

type Callback = (items: unknown[]) => void;

// Each listener registers its callback and a spy unsubscribe under "kind:bookId".
const listeners = vi.hoisted(() => ({
  callbacks: new Map<string, Callback>(),
  unsubscribes: new Map<string, ReturnType<typeof vi.fn>>(),
}));

const register = (key: string, cb: Callback) => {
  const unsubscribe = vi.fn();
  listeners.callbacks.set(key, cb);
  listeners.unsubscribes.set(key, unsubscribe);
  return unsubscribe;
};

vi.mock("../../services/bookService", () => ({
  listenToBooks: (_uid: string, cb: Callback) => register("books", cb),
}));
vi.mock("../../services/noteService", () => ({
  listenToNotes: (_uid: string, bookId: string, cb: Callback) => register(`notes:${bookId}`, cb),
}));
vi.mock("../../services/actionItemService", () => ({
  listenToActionItems: (_uid: string, bookId: string, cb: Callback) => register(`actions:${bookId}`, cb),
}));
vi.mock("../../services/readingSessionService", () => ({
  listenToReadingSessions: (_uid: string, bookId: string, cb: Callback) => register(`sessions:${bookId}`, cb),
}));

import { LibraryProvider } from "../../lib/library/LibraryProvider";
import { useLibrary, type LibraryData } from "../../lib/library/useLibrary";

const book = (id: string): Book => ({
  id,
  title: id,
  author: "A",
  status: "reading",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const probe: { latest?: LibraryData } = {};
function Probe({ onRender }: { onRender: (data: LibraryData) => void }) {
  onRender(useLibrary());
  return null;
}

const emit = (key: string, items: unknown[]) => act(() => listeners.callbacks.get(key)!(items));

describe("LibraryProvider", () => {
  beforeEach(() => {
    listeners.callbacks.clear();
    listeners.unsubscribes.clear();
    render(
      <LibraryProvider uid="u1">
        <Probe onRender={(data) => (probe.latest = data)} />
      </LibraryProvider>
    );
  });

  it("subscribes to notes, actions and sessions per book and reports loading", () => {
    expect(probe.latest!.booksLoaded).toBe(false);

    emit("books", [book("b1"), book("b2")]);
    expect(probe.latest!.booksLoaded).toBe(true);
    expect([...listeners.callbacks.keys()].sort()).toEqual([
      "actions:b1", "actions:b2", "books", "notes:b1", "notes:b2", "sessions:b1", "sessions:b2",
    ]);
    expect(probe.latest!.detailsLoaded).toBe(false);

    for (const id of ["b1", "b2"]) {
      emit(`notes:${id}`, []);
      emit(`actions:${id}`, []);
      emit(`sessions:${id}`, []);
    }
    expect(probe.latest!.detailsLoaded).toBe(true);
  });

  it("stamps items with their parent book id (legacy action items stored bookId '')", () => {
    emit("books", [book("b1")]);
    emit("actions:b1", [{ id: "a1", bookId: "", description: "x", status: "open", createdAt: new Date() }]);

    expect(probe.latest!.actionItems.map((a) => a.bookId)).toEqual(["b1"]);
    expect(probe.latest!.detailsFor("b1").actionItems).toHaveLength(1);
  });

  it("only subscribes new books and unsubscribes deleted ones", () => {
    emit("books", [book("b1"), book("b2")]);
    const b1Notes = listeners.unsubscribes.get("notes:b1")!;
    const b2Notes = listeners.unsubscribes.get("notes:b2")!;
    emit("notes:b2", [{ id: "n1", bookId: "b2", title: "t", content: "c", createdAt: new Date(), updatedAt: new Date() }]);

    emit("books", [book("b1"), book("b3")]);

    expect(b2Notes).toHaveBeenCalledTimes(1);
    expect(b1Notes).not.toHaveBeenCalled();
    expect(listeners.unsubscribes.get("notes:b1")).toBe(b1Notes); // not re-subscribed
    expect(listeners.callbacks.has("notes:b3")).toBe(true);
    // Data of the deleted book no longer shows up.
    expect(probe.latest!.notes).toEqual([]);
  });
});
