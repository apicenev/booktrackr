import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { deleteBook } from "../services/bookService";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import type { Book, BookStatus } from "../types/Book";
import { LIBRARY_STATUSES, STATUS_LABEL, isInLibrary, progressPercent } from "../domain/book";
import BookCover from "../components/book/BookCover";
import StatusBadge from "../components/book/StatusBadge";
import ProgressBar from "../components/book/ProgressBar";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { BookOpenIcon, FunnelIcon } from "@heroicons/react/24/outline";

type BookFilter = "all" | BookStatus;

const FILTERS: { key: BookFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...LIBRARY_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
];

export default function LibraryPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const { books: allBooks, booksLoaded, error: loadError } = useLibrary();
  const books = useMemo(() => allBooks.filter(isInLibrary), [allBooks]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const result: Record<BookFilter, number> = { all: 0, wishlist: 0, "to-read": 0, reading: 0, finished: 0 };
    for (const b of books) {
      result.all += 1;
      result[b.status] += 1;
    }
    return result;
  }, [books]);

  const visibleBooks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return books
      .filter((b) => filter === "all" || b.status === filter)
      .filter(
        (b) =>
          !term || b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term)
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [books, filter, search]);

  const handleDelete = async (book: Book) => {
    if (!uid) return;
    if (!window.confirm(`Remove “${book.title}” and all its notes and actions?`)) return;

    setActionError(null);
    try {
      await deleteBook(uid, book.id);
    } catch (err) {
      console.error("Failed to delete book", err);
      setActionError(`Could not delete “${book.title}”. Please try again.`);
    }
  };

  const emptyCopy =
    counts.all === 0
      ? "No books yet. Find your first one on Explore to start tracking."
      : "No books match your filters.";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your Library"
        description="Browse your books, jump into details, and capture insights."
        actions={
          <Link to="/explore" className="btn btn-primary">
            <PlusIcon aria-hidden="true" className="size-4" />
            Find books
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className="chip"
              >
                {f.label} <span className="tabular-nums opacity-70">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or author"
            aria-label="Search library"
            className="h-9 w-full rounded-control border border-control bg-surface pr-3 pl-9 text-sm text-ink transition placeholder:text-ink-subtle focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
          />
        </div>
      </div>

      {actionError && (
        <p role="alert" className="alert-error">
          {actionError}
        </p>
      )}

      {loadError ? (
        <p role="alert" className="alert-error">
          {loadError}
        </p>
      ) : !booksLoaded ? (
        <div>
        <p className="sr-only">Loading your library…</p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-[2/3] w-full" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
        </div>
      ) : visibleBooks.length === 0 ? (
        <EmptyState
          icon={counts.all === 0 ? BookOpenIcon : FunnelIcon}
          action={
            counts.all === 0 && (
              <Link to="/explore" className="btn btn-primary">
                Explore books
              </Link>
            )
          }
        >
          {emptyCopy}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibleBooks.map((book) => {
            const percent = progressPercent(book);
            return (
              <li key={book.id} className="group relative">
                <Link to={`/books/${book.id}`} className="block rounded-control focus-visible:outline-offset-4">
                  <div className="transition duration-200 group-hover:-translate-y-1">
                    <BookCover title={book.title} author={book.author} coverId={book.coverId} size="fill" />
                  </div>
                  <h3 className="book-title mt-3 line-clamp-2 text-base group-hover:text-brand-ink">
                    {book.title}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{book.author}</p>
                  <div className="mt-2">
                    <StatusBadge status={book.status} />
                  </div>

                  {percent !== null && (
                    <div className="mt-2.5">
                      <ProgressBar percent={percent} label={`Progress of ${book.title}`} />
                      <p className="mt-1 text-xs text-ink-subtle tabular-nums">
                        {book.pagesRead ?? 0}/{book.totalPages}
                      </p>
                    </div>
                  )}
                </Link>

                {/* Sibling of the link (not nested) so both stay valid, focusable controls. */}
                <button
                  type="button"
                  onClick={() => handleDelete(book)}
                  aria-label={`Delete ${book.title}`}
                  className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full bg-surface/90 text-ink-muted shadow-card transition hover:bg-danger hover:text-white focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <TrashIcon aria-hidden="true" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
