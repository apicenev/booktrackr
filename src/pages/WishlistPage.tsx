import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import { deleteBook, updateBook } from "../services/bookService";
import type { Book } from "../types/Book";
import BookCover from "../components/book/BookCover";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { BookmarkIcon } from "@heroicons/react/24/outline";

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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Wishlist</h1>
          <p className="page-lead">
            Books you're interested in but haven't committed to yet. Move one to your library when
            you get it.
          </p>
        </div>
        <Link
          to="/explore"
          className="btn btn-primary self-start sm:self-auto"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          Find books
        </Link>
      </div>

      {actionError && (
        <p role="alert" className="alert-error">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : !booksLoaded ? (
        <LoadingState label="Loading your wishlist…" />
      ) : wishlist.length === 0 ? (
        <EmptyState icon={BookmarkIcon}>
          Your wishlist is empty. Use “Want to read” on Explore to save books for later.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((book) => (
            <li
              key={book.id}
              className="card card-interactive flex flex-col p-4"
            >
              <Link to={`/books/${book.id}`} className="group flex gap-4">
                <BookCover title={book.title} author={book.author} coverId={book.coverId} size="md" />
                <div className="min-w-0">
                  <h3 className="book-title line-clamp-2 text-base group-hover:text-brand-ink">{book.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{book.author}</p>
                  <p className="mt-2 text-xs text-ink-subtle">
                    {[book.totalPages && `${book.totalPages} pages`, `added ${book.createdAt.toLocaleDateString()}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  type="button"
                  disabled={busyId === book.id}
                  onClick={() => moveToLibrary(book)}
                  className="btn btn-sm btn-primary flex-1"
                >
                  Move to library
                </button>
                <button
                  type="button"
                  disabled={busyId === book.id}
                  onClick={() => remove(book)}
                  aria-label={`Remove ${book.title} from wishlist`}
                  className="btn btn-sm btn-ghost hover:bg-danger-soft hover:text-danger-ink"
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
