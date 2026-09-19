import { useState } from "react";
import { CheckIcon } from "@heroicons/react/16/solid";
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
              className="btn btn-sm btn-secondary tabular-nums"
            >
              +{step}
            </button>
          ))}
        {atEnd && book.status !== "finished" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => log(current, "finished")}
            className="btn btn-sm btn-success"
          >
            <CheckIcon aria-hidden="true" className="size-4" />
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
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              I'm on page
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={book.totalPages}
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder={String(current)}
                className="h-8 w-20 rounded-control border border-control bg-surface px-2 text-sm text-ink tabular-nums transition placeholder:text-ink-subtle focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none user-invalid:border-danger"
              />
            </label>
            <button type="submit" disabled={saving || page === ""} className="btn btn-sm btn-secondary">
              Log
            </button>
          </form>
        )}
      </div>

      <p aria-live="polite" className="min-h-4 text-xs">
        {error ? (
          <span role="alert" className="text-danger-ink">
            {error}
          </span>
        ) : (
          message && (
            <span className="inline-flex items-center gap-1 font-medium text-success-ink">
              <CheckIcon aria-hidden="true" className="size-3.5" />
              {message}
            </span>
          )
        )}
      </p>
    </div>
  );
}
