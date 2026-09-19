import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../../types/Book";
import type { Note } from "../../types/Note";

vi.mock("../../lib/auth/useAuth", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));
const noteService = vi.hoisted(() => ({ updateNote: vi.fn(), deleteNote: vi.fn() }));
vi.mock("../../services/noteService", () => noteService);

const book = (id: string, title: string): Book => ({
  id,
  title,
  author: "A",
  status: "reading",
  createdAt: new Date(),
  updatedAt: new Date(),
});
const books = [book("b1", "Clean Code"), book("b2", "Refactoring")];
const note: Note = {
  id: "n1",
  bookId: "b1",
  title: "Small functions",
  content: "Do one thing",
  tags: ["design"],
  isKeyInsight: false,
  linkedBookIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("../../lib/library/useLibrary", () => ({
  useLibrary: () => ({
    books,
    error: null,
    getBook: (id: string) => books.find((b) => b.id === id),
    detailsFor: () => ({ notes: [note], actionItems: [], sessions: [], loaded: true }),
  }),
}));

import NotesList from "../../components/book/NotesList";

describe("NotesList editing", () => {
  beforeEach(() => {
    noteService.updateNote.mockReset().mockResolvedValue(undefined);
  });

  it("edits a note, marks it as key insight and links a related book", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotesList bookId="b1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Edit section Small functions" }));
    const heading = screen.getByLabelText("Heading");
    await user.clear(heading);
    await user.type(heading, "Tiny functions");
    await user.click(screen.getByLabelText(/Key insight/));
    await user.selectOptions(screen.getByLabelText(/Related books/), "b2");
    // The book the note belongs to can't be linked to itself.
    expect(within(screen.getByLabelText(/Related books/)).queryByText(/Clean Code/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(noteService.updateNote).toHaveBeenCalledWith("u1", "b1", "n1", {
      title: "Tiny functions",
      content: "Do one thing",
      tags: ["design"],
      isKeyInsight: true,
      linkedBookIds: ["b2"],
    });
    // Back to read mode after saving.
    expect(await screen.findByRole("button", { name: "Edit section Small functions" })).toBeInTheDocument();
  });

  it("keeps the editor open with an error when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    noteService.updateNote.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotesList bookId="b1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Edit section Small functions" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to save the section");
    expect(screen.getByLabelText("Heading")).toBeInTheDocument();
  });
});
