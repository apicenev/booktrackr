import { useState } from "react";
import { useAuth } from "../../lib/auth/useAuth";
import { saveProgress } from "../../services/readingSessionService";
import { applyProgressUpdate } from "../../domain/book";
import type { Book } from "../../types/Book";

const STEPS = [5, 10, 25];

/**
 * One-tap progress logging. Every log goes through saveProgress, which records
 * a reading session with the page delta next to the book update.
 */
export default function QuickLog({ book, compact = false }: { book: Book; compact?: boolean }) {
  const { user } = useAuth();
  const [page, setPage] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = book.pagesRead ?? 0;
  const atEnd = book.totalPages !== undefined && current >= book.totalPages;

  const log = async (pagesRead: number, status = book.status) => {
    if (!user?.uid) return;
    const patch = applyProgressUpdate(book, { status, totalPages: book.totalPages, pagesRead });
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveProgress(user.uid, book, patch);
      const gained = (patch.pagesRead ?? 0) - current;
      setMessage(
        patch.status === "finished" && book.status !== "finished"
          ? "Finished — congratulations!"
          : gained > 0
            ? `+${gained} pages logged`
            : "Progress updated"
      );
      setPage("");
    } catch (err) {
      console.error("Failed to log progress", err);
      setError("Could not log progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const buttonClass =
    "rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-100 ring-1 ring-slate-700 transition hover:bg-slate-700 disabled:opacity-50";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!atEnd &&
          (compact ? STEPS.slice(1) : STEPS).map((step) => (
            <button
              key={step}
              type="button"
              disabled={saving}
              onClick={() => log(current + step)}
              aria-label={`Log ${step} more pages of ${book.title}`}
              className={buttonClass}
            >
              +{step}
            </button>
          ))}
        {atEnd && book.status !== "finished" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => log(current, "finished")}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            Mark as finished
          </button>
        )}

        {!compact && !atEnd && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = Number.parseInt(page, 10);
              if (target >= 0) log(target);
            }}
            className="flex items-center gap-2"
          >
            <label className="flex items-center gap-2 text-xs text-slate-400">
              I'm on page
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={book.totalPages}
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder={String(current)}
                className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </label>
            <button type="submit" disabled={saving || page === ""} className={buttonClass}>
              Log
            </button>
          </form>
        )}
      </div>

      <p aria-live="polite" className="min-h-4 text-xs">
        {error ? (
          <span role="alert" className="text-red-400">
            {error}
          </span>
        ) : (
          message && <span className="text-emerald-300">{message}</span>
        )}
      </p>
    </div>
  );
}
