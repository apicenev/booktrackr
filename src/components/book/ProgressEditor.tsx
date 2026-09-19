import { useState } from "react";
import type { Book, BookStatus } from "../../types/Book";
import { BOOK_STATUSES, applyProgressUpdate, progressPercent } from "../../domain/book";
import ProgressBar from "./ProgressBar";

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
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-subtle">
          <span>Progress</span>
          <span className="tabular-nums">{preview === null ? "Add total pages" : `${preview}%`}</span>
        </div>
        <ProgressBar percent={preview ?? 0} label="Reading progress" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <label className="field">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="select"
          >
            {BOOK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            Pages read
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="input tabular-nums"
              placeholder="40"
            />
          </label>

          <label className="field">
            Total pages
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="input tabular-nums"
              placeholder="320"
            />
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="msg-error">
          {error}
        </p>
      )}

      <button type="button" disabled={saving} onClick={save} className="btn btn-primary w-full">
        {saving ? "Saving…" : "Save progress"}
      </button>
    </div>
  );
}
