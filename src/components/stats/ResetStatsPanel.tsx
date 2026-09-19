import { useState } from "react";
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
      className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="reset-heading" className="text-sm font-semibold text-slate-100">
            Reset statistics
          </h2>
          <p className="mt-1 text-xs text-slate-400">Start your stats from a clean slate.</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
            className="rounded-xl bg-red-600/15 px-4 py-2 text-sm text-red-200 ring-1 ring-red-500/30 transition hover:bg-red-600/25"
          >
            Reset statistics…
          </button>
        )}
      </div>

      {done && !open && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          Statistics reset. Everything you log from now on starts fresh.
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-slate-300">This permanently deletes:</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            <li>your whole reading history (pages per month, streaks, pace)</li>
            <li>the start and finish dates of all books (books finished per year)</li>
            <li>all yearly reading goals</li>
          </ul>
          <p className="text-slate-400">
            Your books, their status and page progress, notes and action items are kept.
          </p>
          <label className="block text-xs font-medium text-slate-400">
            Type <span className="font-mono text-slate-200">{CONFIRM_WORD}</span> to confirm
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-1 block w-40 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={confirmText !== CONFIRM_WORD || resetting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resetting ? "Resetting…" : "Permanently reset"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={resetting}
              className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
