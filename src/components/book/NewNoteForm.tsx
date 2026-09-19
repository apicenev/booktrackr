import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import { createNote } from "../../services/noteService";
import NoteForm, { type NoteValues } from "./NoteForm";

export default function NewNoteForm({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { books } = useLibrary();

  const create = async (values: NoteValues) => {
    if (!user?.uid) return;
    await createNote(user.uid, bookId, values);
  };

  return (
    <div className="well p-4">
      <h3 className="text-sm font-semibold text-ink">New section</h3>
      <p className="mt-0.5 mb-4 text-xs text-ink-subtle">
        Use a heading from the book (e.g. “Chapter 3 — Dependency Inversion”).
      </p>
      <NoteForm
        bookId={bookId}
        books={books}
        submitLabel="Add"
        pendingLabel="Adding…"
        onSubmit={create}
        resetOnSubmit
      />
    </div>
  );
}
