import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import type { Note } from "../../types/Note";
import { deleteNote, updateNote } from "../../services/noteService";
import NoteForm, { type NoteValues } from "./NoteForm";

export default function NotesList({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { books, getBook, detailsFor, error: loadError } = useLibrary();
  const { notes, loaded } = detailsFor(bookId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Key insights first, then newest first by updatedAt.
  const sorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          Number(b.isKeyInsight ?? false) - Number(a.isKeyInsight ?? false) ||
          b.updatedAt.getTime() - a.updatedAt.getTime()
      ),
    [notes]
  );

  const onDelete = async (note: Note) => {
    if (!uid) return;
    if (!window.confirm(`Delete the section “${note.title}”?`)) return;
    setActionError(null);
    try {
      await deleteNote(uid, bookId, note.id);
    } catch (err) {
      console.error("Failed to delete note", err);
      setActionError("Could not delete the section. Please try again.");
    }
  };

  const onSave = async (noteId: string, values: NoteValues) => {
    if (!uid) return;
    await updateNote(uid, bookId, noteId, values);
    setEditingId(null);
  };

  if (loadError) {
    return <p role="alert" className="text-sm text-red-400">{loadError}</p>;
  }

  if (!loaded) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading sections…</p>;
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
        <p className="text-sm text-slate-400">
          No sections yet. Create your first heading above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="text-sm text-red-400">{actionError}</p>
      )}
      {sorted.map((n) => {
        if (editingId === n.id) {
          return (
            <article key={n.id} className="rounded-2xl border border-indigo-500/30 bg-slate-950/40 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-100">Edit section</h4>
              <NoteForm
                bookId={bookId}
                books={books}
                initial={n}
                submitLabel="Save"
                pendingLabel="Saving…"
                onSubmit={(values) => onSave(n.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </article>
          );
        }

        const linked = (n.linkedBookIds ?? [])
          .map((id) => getBook(id))
          .filter((b) => b !== undefined);

        return (
          <article
            key={n.id}
            className={`rounded-2xl border bg-slate-950/30 p-4 ${
              n.isKeyInsight ? "border-amber-400/30" : "border-slate-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {n.isKeyInsight && (
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-amber-300">
                    <span aria-hidden="true">★ </span>Key insight
                  </p>
                )}
                <h4 className="text-sm font-semibold text-slate-100">{n.title}</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Updated {n.updatedAt.toLocaleString()}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(n.id)}
                  aria-label={`Edit section ${n.title}`}
                  className="rounded-xl bg-slate-800/60 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-slate-700/60 transition hover:bg-slate-700/60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n)}
                  aria-label={`Delete section ${n.title}`}
                  className="rounded-xl bg-red-600/10 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/20 transition hover:bg-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>

            {n.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/knowledge?tag=${encodeURIComponent(t)}`}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] text-slate-200 ring-1 ring-slate-700/70 bg-slate-900/40 hover:ring-slate-500"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {n.content}
            </div>

            {linked.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                Related:
                {linked.map((b) => (
                  <Link
                    key={b.id}
                    to={`/books/${b.id}`}
                    className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-200 ring-1 ring-indigo-400/30 hover:bg-indigo-500/20"
                  >
                    {b.title}
                  </Link>
                ))}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
