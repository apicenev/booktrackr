import { useEffect, useMemo, useState } from "react";
import type { Book, BookStatus } from "../../types/Book";

export default function ProgressEditor({
  book,
  onUpdate,
}: {
  book: Book;
  onUpdate: (patch: Partial<Book>) => Promise<void> | void;
}) {
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [totalPages, setTotalPages] = useState<string>(book.totalPages?.toString() ?? "");
  const [pagesRead, setPagesRead] = useState<string>(book.pagesRead?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(book.status);
    setTotalPages(book.totalPages?.toString() ?? "");
    setPagesRead(book.pagesRead?.toString() ?? "");
  }, [book.id, book.status, book.totalPages, book.pagesRead]);

  const percent = useMemo(() => {
    const tp = Number(totalPages);
    const pr = Number(pagesRead);
    if (!tp || !pr || tp <= 0) return 0;
    const raw = (pr / tp) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }, [totalPages, pagesRead]);

  const save = async () => {
    const tp = totalPages ? Number(totalPages) : undefined;
    const pr = pagesRead ? Number(pagesRead) : undefined;

    // basic sanity: if both exist, clamp pagesRead
    const clamped =
      typeof tp === "number" && typeof pr === "number" && tp > 0
        ? Math.min(pr, tp)
        : pr;

    setSaving(true);
    try {
      await onUpdate({
        status,
        totalPages: tp,
        pagesRead: clamped,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Percent bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Percentage</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500/80"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="to-read">To read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Total pages
            </label>
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="320"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Pages read
            </label>
            <input
              type="number"
              min={0}
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="40"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className={[
          "w-full rounded-xl px-4 py-2 text-sm font-medium",
          "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20",
          "transition hover:bg-indigo-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {saving ? "Saving…" : "Save progress"}
      </button>
    </div>
  );
}
