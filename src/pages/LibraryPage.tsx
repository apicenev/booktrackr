import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteBook } from "../services/bookService";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import type { Book, BookStatus } from "../types/Book";
import { LIBRARY_STATUSES, STATUS_LABEL, isInLibrary, progressPercent } from "../domain/book";
import BookCover from "../components/book/BookCover";
import StatusBadge from "../components/book/StatusBadge";
import ProgressBar from "../components/book/ProgressBar";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Your Library</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse your books, jump into details, and capture insights.
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <span aria-hidden="true">+</span> Find books
        </Link>
      </div>

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
                className={[
                  "rounded-full px-4 py-2 text-sm transition cursor-pointer ring-1",
                  active
                    ? "bg-indigo-600 text-white ring-indigo-500/40"
                    : "bg-slate-900/60 text-slate-200 ring-slate-800/80 hover:bg-slate-800/60",
                ].join(" ")}
              >
                {f.label} <span className="opacity-70">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or author"
          aria-label="Search library"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 sm:w-64"
        />
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      {loadError ? (
        <p role="alert" className="text-sm text-red-400">
          {loadError}
        </p>
      ) : !booksLoaded ? (
        <p className="text-sm text-slate-400 animate-pulse">Loading your library…</p>
      ) : visibleBooks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-sm text-slate-400">{emptyCopy}</p>
          {counts.all === 0 && (
            <Link
              to="/explore"
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Explore books
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleBooks.map((book) => {
            const percent = progressPercent(book);
            return (
              <li key={book.id} className="group relative">
                <Link
                  to={`/books/${book.id}`}
                  className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 pr-14 shadow-lg shadow-black/20 backdrop-blur transition hover:border-indigo-500/30 hover:bg-slate-900/65 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <BookCover title={book.title} coverId={book.coverId} />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-100">{book.title}</h3>
                    <p className="mt-0.5 truncate text-sm text-slate-400">{book.author}</p>
                    <div className="mt-2">
                      <StatusBadge status={book.status} />
                    </div>

                    {percent !== null ? (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Progress</span>
                          <span>
                            {book.pagesRead ?? 0}/{book.totalPages}
                          </span>
                        </div>
                        <ProgressBar percent={percent} label={`Progress of ${book.title}`} />
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        Open to add notes, action items, and progress.
                      </p>
                    )}
                  </div>
                </Link>

                {/* Sibling of the link (not nested) so both stay valid, focusable controls. */}
                <button
                  type="button"
                  onClick={() => handleDelete(book)}
                  aria-label={`Delete ${book.title}`}
                  className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-slate-800/80 text-slate-300 transition hover:bg-red-600 hover:text-white focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/40 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <span aria-hidden="true">🗑️</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
