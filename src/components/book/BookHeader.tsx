import type { Book } from "../../types/Book";

const statusPill: Record<Book["status"], string> = {
  "to-read": "bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/50",
  reading: "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30",
  finished: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
};

const statusLabel: Record<Book["status"], string> = {
  "to-read": "to read",
  reading: "reading",
  finished: "finished",
};

export default function BookHeader({
  book,
  percent,
  onDelete,
}: {
  book: Book;
  percent: number | null;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-100">
              {book.title}
            </h1>
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                statusPill[book.status],
              ].join(" ")}
            >
              {statusLabel[book.status]}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-400">{book.author}</p>

          {percent !== null ? (
            <p className="mt-3 text-xs text-slate-500">
              {percent}% read · {book.pagesRead ?? 0}/{book.totalPages ?? 0} pages
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Add total pages to see percentage progress.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-red-600/15 px-4 py-2 text-sm text-red-200 ring-1 ring-red-500/25 transition hover:bg-red-600/25 cursor-pointer"
          >
            Delete book
          </button>
        </div>
      </div>
    </div>
  );
}
