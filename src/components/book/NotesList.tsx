import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import type { Note } from "../../types/Note";
import { deleteNote, getNotes } from "../../services/noteService";

export default function NotesList({ bookId }: { bookId: string }) {
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const all = await getNotes(user.uid, bookId);
    // newest first by updatedAt
    all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    setNotes(all);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.uid) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, bookId]);

  const empty = useMemo(() => notes.length === 0 && !loading, [notes.length, loading]);

  const onDelete = async (noteId: string) => {
    if (!user?.uid) return;
    const ok = window.confirm("Delete this section?");
    if (!ok) return;
    await deleteNote(user.uid, bookId, noteId);
    await refresh();
  };

  if (loading) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading sections…</p>;
  }

  if (empty) {
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
      {notes.map((n) => (
        <div
          key={n.id}
          className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold text-slate-100">
                {n.title}
              </h4>
              <p className="mt-1 text-[11px] text-slate-500">
                Updated {n.updatedAt.toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDelete(n.id)}
              className="rounded-xl bg-red-600/10 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/20 transition hover:bg-red-600/20"
            >
              Delete
            </button>
          </div>

          {n.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {n.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] text-slate-200 ring-1 ring-slate-700/70 bg-slate-900/40"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {n.content}
          </div>
        </div>
      ))}
    </div>
  );
}
