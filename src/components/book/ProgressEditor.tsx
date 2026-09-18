import { useState } from "react";
import type { Book, BookStatus } from "../../types/Book";
import { BOOK_STATUSES, applyProgressUpdate, progressPercent } from "../../domain/book";
import ProgressBar from "./ProgressBar";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

const parsePages = (value: string) => (value.trim() === "" ? undefined : Number(value));

/**
 * Edits status and page counts. The parent remounts it (via `key`) whenever the
 * stored values change, so local state never drifts from the saved book.
 */
export default function ProgressEditor({
  book,
  onUpdate,
}: {
  book: Book;
  onUpdate: (patch: Partial<Book>) => Promise<void>;
}) {
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [totalPages, setTotalPages] = useState(book.totalPages?.toString() ?? "");
  const [pagesRead, setPagesRead] = useState(book.pagesRead?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = progressPercent({
    totalPages: parsePages(totalPages),
    pagesRead: parsePages(pagesRead),
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(
        applyProgressUpdate(book, {
          status,
          totalPages: parsePages(totalPages),
          pagesRead: parsePages(pagesRead),
        })
      );
    } catch (err) {
      console.error("Failed to save progress", err);
      setError("Could not save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>Progress</span>
          <span>{preview === null ? "Add total pages" : `${preview}%`}</span>
        </div>
        <ProgressBar percent={preview ?? 0} label="Reading progress" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="block text-xs font-medium text-slate-400">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className={inputClass}
          >
            {BOOK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-slate-400">
            Pages read
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className={inputClass}
              placeholder="40"
            />
          </label>

          <label className="block text-xs font-medium text-slate-400">
            Total pages
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className={inputClass}
              placeholder="320"
            />
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save progress"}
      </button>
    </div>
  );
}
