import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/16/solid";
import { useAuth } from "../../lib/auth/useAuth";
import { resetStatistics } from "../../services/statsService";
import { writeErrorMessage } from "../../lib/firestoreUtils";
import type { Book } from "../../types/Book";

const CONFIRM_WORD = "RESET";

/** Irreversible reset of all statistics data, behind a typed confirmation. */
export default function ResetStatsPanel({
  books,
  onReset,
}: {
  books: Book[];
  /** Called after a successful reset. */
  onReset?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirmText("");
    setError(null);
  };

  const reset = async () => {
    if (!user?.uid) return;
    setResetting(true);
    setError(null);
    try {
      await resetStatistics(user.uid, books);
      setDone(true);
      close();
      onReset?.();
    } catch (err) {
      console.error("Failed to reset statistics", err);
      setError(writeErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <section
      aria-labelledby="reset-heading"
      className="rounded-card border border-danger/25 bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="reset-heading" className="text-sm font-semibold text-ink">
            Reset statistics
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Start your stats from a clean slate.</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
            className="btn btn-danger-ghost border border-danger/30"
          >
            Reset statistics…
          </button>
        )}
      </div>

      {done && !open && (
        <p role="status" className="msg-success mt-3 flex items-center gap-1.5">
          <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0" />
          Statistics reset. Everything you log from now on starts fresh.
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-ink">This permanently deletes:</p>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted marker:text-danger">
            <li>your whole reading history (pages per month, streaks, pace)</li>
            <li>the start and finish dates of all books (books finished per year)</li>
            <li>all yearly reading goals</li>
          </ul>
          <p className="text-ink-muted">
            Your books, their status and page progress, notes and action items are kept.
          </p>
          <label className="field">
            Type <span className="font-mono text-danger-ink">{CONFIRM_WORD}</span> to confirm
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-1.5 block h-10 w-40 rounded-control border border-control bg-surface px-3 font-mono text-sm text-ink transition focus:border-danger focus:ring-3 focus:ring-danger/15 focus:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-danger-ink">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={confirmText !== CONFIRM_WORD || resetting}
              className="btn btn-danger"
            >
              {resetting ? "Resetting…" : "Permanently reset"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={resetting}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
