import { useMemo, useState } from "react";
import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import { deleteReadingSessionAndRevert } from "../../services/readingSessionService";
import type { Book } from "../../types/Book";
import type { ReadingSession } from "../../types/ReadingSession";

const VISIBLE = 5;

export default function SessionHistory({ book }: { book: Book }) {
  const { user } = useAuth();
  const { detailsFor } = useLibrary();
  const { sessions, loaded } = detailsFor(book.id);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    [sessions]
  );

  if (!loaded || sorted.length === 0) return null;

  const undo = async (session: ReadingSession) => {
    if (!user?.uid) return;
    if (!window.confirm(`Remove this entry and take ${session.pagesRead ?? 0} pages off your progress?`)) return;
    setError(null);
    try {
      await deleteReadingSessionAndRevert(user.uid, book, session);
    } catch (err) {
      console.error("Failed to remove reading session", err);
      setError("Could not remove the entry. Please try again.");
    }
  };

  const visible = showAll ? sorted : sorted.slice(0, VISIBLE);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-100">Reading history</h3>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
      <ul className="mt-2 divide-y divide-slate-800 text-sm">
        {visible.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 py-1.5">
            <span className="text-slate-400">
              {s.startedAt.toLocaleDateString()}{" "}
              <span className="text-slate-500">
                {s.startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-slate-200">+{s.pagesRead ?? 0} pages</span>
              <button
                type="button"
                onClick={() => undo(s)}
                aria-label={`Remove entry from ${s.startedAt.toLocaleString()}`}
                className="rounded px-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-300"
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
      {sorted.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 text-xs text-slate-400 hover:text-slate-200"
        >
          {showAll ? "Show less" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}
