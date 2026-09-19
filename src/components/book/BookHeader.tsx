import { TrashIcon } from "@heroicons/react/16/solid";
import type { Book } from "../../types/Book";
import BookCover from "./BookCover";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

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
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <BookCover title={book.title} author={book.author} coverId={book.coverId} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <StatusBadge status={book.status} />
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-2 text-lg text-ink-muted">{book.author}</p>
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="btn btn-sm btn-danger-ghost"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
            {deleting ? "Deleting…" : "Delete book"}
          </button>
        </div>

        <div className="mt-6 max-w-md">
          {percent !== null && <ProgressBar percent={percent} label={`Progress of ${book.title}`} />}
          <p className="mt-2 text-sm text-ink-muted">
            {percent !== null
              ? `${percent}% read · ${book.pagesRead ?? 0}/${book.totalPages} pages`
              : "Add total pages to see percentage progress."}
          </p>
          {book.finishedAt && (
            <p className="mt-1 text-sm text-ink-subtle">
              Finished {book.finishedAt.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
