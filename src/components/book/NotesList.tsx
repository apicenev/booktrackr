import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PencilSquareIcon, StarIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import type { Note } from "../../types/Note";
import { deleteNote, updateNote } from "../../services/noteService";
import NoteForm, { type NoteValues } from "./NoteForm";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

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
    return <p role="alert" className="msg-error">{loadError}</p>;
  }

  if (!loaded) {
    return <LoadingState label="Loading sections…" compact />;
  }

  if (sorted.length === 0) {
    return (
      <EmptyState icon={DocumentTextIcon} compact>
        No sections yet. Create your first heading above.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="msg-error">{actionError}</p>
      )}
      {sorted.map((n) => {
        if (editingId === n.id) {
          return (
            <article key={n.id} className="rounded-card border border-brand/30 bg-surface p-5 ring-3 ring-brand/10">
              <h4 className="mb-4 text-sm font-semibold text-ink">Edit section</h4>
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
            className={`rounded-card border bg-surface p-5 ${
              n.isKeyInsight ? "border-warning/40 shadow-[inset_3px_0_0_var(--color-warning)]" : "border-line"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {n.isKeyInsight && (
                  <p className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium tracking-wide text-warning-ink uppercase">
                    <StarIcon aria-hidden="true" className="size-3.5" />
                    Key insight
                  </p>
                )}
                <h4 className="font-serif text-lg font-semibold leading-snug text-ink">{n.title}</h4>
                <p className="mt-1 text-xs text-ink-subtle">
                  Updated {n.updatedAt.toLocaleString()}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEditingId(n.id)}
                  aria-label={`Edit section ${n.title}`}
                  className="btn btn-sm btn-ghost"
                >
                  <PencilSquareIcon aria-hidden="true" className="size-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n)}
                  aria-label={`Delete section ${n.title}`}
                  className="btn btn-sm btn-danger-ghost"
                >
                  <TrashIcon aria-hidden="true" className="size-4" />
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
                    className="tag"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-3 max-w-prose whitespace-pre-wrap text-base leading-7 text-ink">
              {n.content}
            </div>

            {linked.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
                Related:
                {linked.map((b) => (
                  <Link
                    key={b.id}
                    to={`/books/${b.id}`}
                    className="rounded-badge bg-brand-soft px-2 py-0.5 font-medium text-brand-ink hover:bg-brand/15"
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
