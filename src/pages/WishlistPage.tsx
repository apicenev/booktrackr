import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import { deleteBook, updateBook } from "../services/bookService";
import type { Book } from "../types/Book";
import BookCover from "../components/book/BookCover";

const WishlistPage = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { books, booksLoaded, error } = useLibrary();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const wishlist = useMemo(
    () =>
      books
        .filter((b) => b.status === "wishlist")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [books]
  );

  const run = async (book: Book, action: () => Promise<void>, failure: string) => {
    setBusyId(book.id);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      console.error(failure, err);
      setActionError(`${failure} Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const moveToLibrary = (book: Book) =>
    uid &&
    run(book, () => updateBook(uid, book.id, { status: "to-read" }), `Could not move “${book.title}”.`);

  const remove = (book: Book) => {
    if (!uid || !window.confirm(`Remove “${book.title}” from your wishlist?`)) return;
    run(book, () => deleteBook(uid, book.id), `Could not remove “${book.title}”.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Wishlist</h1>
          <p className="mt-1 text-sm text-slate-400">
            Books you're interested in but haven't committed to yet. Move one to your library when
            you get it.
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <span aria-hidden="true">+</span> Find books
        </Link>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : !booksLoaded ? (
        <p className="text-sm text-slate-400 animate-pulse">Loading your wishlist…</p>
      ) : wishlist.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-sm text-slate-400">
            Your wishlist is empty. Use “Want to read” on Explore to save books for later.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {wishlist.map((book) => (
            <li
              key={book.id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-black/20"
            >
              <Link to={`/books/${book.id}`} className="group flex gap-4">
                <BookCover title={book.title} coverId={book.coverId} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-100 group-hover:text-indigo-200">{book.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-slate-400">{book.author}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[book.totalPages && `${book.totalPages} pages`, `added ${book.createdAt.toLocaleDateString()}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === book.id}
                  onClick={() => moveToLibrary(book)}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  Move to library
                </button>
                <button
                  type="button"
                  disabled={busyId === book.id}
                  onClick={() => remove(book)}
                  aria-label={`Remove ${book.title} from wishlist`}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishlistPage;
