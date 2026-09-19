import type { Book } from "../../types/Book";
import BookCover from "./BookCover";
import StatusBadge from "./StatusBadge";

export default function BookHeader({
  book,
  percent,
  onDelete,
  deleting,
}: {
  book: Book;
  percent: number | null;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <BookCover title={book.title} coverId={book.coverId} size="lg" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                {book.title}
              </h1>
              <StatusBadge status={book.status} />
            </div>

            <p className="mt-1 text-sm text-slate-400">{book.author}</p>

            <p className="mt-3 text-xs text-slate-500">
              {percent !== null
                ? `${percent}% read · ${book.pagesRead ?? 0}/${book.totalPages} pages`
                : "Add total pages to see percentage progress."}
            </p>
            {book.finishedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Finished {book.finishedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="self-start rounded-xl bg-red-600/15 px-4 py-2 text-sm text-red-200 ring-1 ring-red-500/25 transition hover:bg-red-600/25 cursor-pointer disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete book"}
        </button>
      </div>
    </div>
  );
}
