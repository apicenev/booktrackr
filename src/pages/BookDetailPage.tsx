import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import type { Book } from "../types/Book";
import { deleteBook, updateBook } from "../services/bookService";
import { saveProgress } from "../services/readingSessionService";
import { progressPercent } from "../domain/book";
import { backlinksFor } from "../domain/knowledge";

import BookHeader from "../components/book/BookHeader";
import ProgressEditor from "../components/book/ProgressEditor";
import QuickLog from "../components/book/QuickLog";
import SessionHistory from "../components/book/SessionHistory";
import NotesList from "../components/book/NotesList";
import NewNoteForm from "../components/book/NewNoteForm";
import ActionItemsList from "../components/book/ActionItemsList";
import NewActionItemForm from "../components/book/NewActionItemForm";

const panelClass =
  "rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/20 backdrop-blur";

export default function BookDetailPage() {
  const { id: bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid;
  const { books, notes, booksLoaded, getBook, error } = useLibrary();

  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const book = bookId ? getBook(bookId) : undefined;
  const backlinks = useMemo(
    () => (bookId ? backlinksFor(bookId, notes, books) : []),
    [bookId, notes, books]
  );

  if (!bookId) return <Navigate to="/library" replace />;

  const handleDelete = async () => {
    if (!uid) return;
    if (!window.confirm("Delete this book and all its notes, actions and reading history?")) return;

    setDeleting(true);
    setActionError(null);
    try {
      await deleteBook(uid, bookId);
      navigate(book?.status === "wishlist" ? "/wishlist" : "/library", { replace: true });
    } catch (err) {
      console.error("Failed to delete book", err);
      setActionError("Could not delete the book. Please try again.");
      setDeleting(false);
    }
  };

  const handleUpdate = async (patch: Partial<Book>) => {
    if (!uid || !book) return;
    await saveProgress(uid, book, patch);
  };

  const moveToLibrary = async () => {
    if (!uid) return;
    setActionError(null);
    try {
      await updateBook(uid, bookId, { status: "to-read" });
    } catch (err) {
      console.error("Failed to move book to library", err);
      setActionError("Could not move the book. Please try again.");
    }
  };

  if (error) {
    return (
      <div className={panelClass}>
        <p role="alert" className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!booksLoaded || deleting) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-slate-400 animate-pulse">
          {deleting ? "Deleting book…" : "Loading book…"}
        </p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-red-400">Book not found.</p>
        <Link
          to="/library"
          className="mt-4 inline-block rounded-xl bg-slate-900/60 px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-800/80 transition hover:bg-slate-800/60"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  const onWishlist = book.status === "wishlist";

  return (
    <div className="space-y-6">
      <Link
        to={onWishlist ? "/wishlist" : "/library"}
        className="text-sm text-slate-400 hover:text-slate-200"
      >
        ← {onWishlist ? "Wishlist" : "Library"}
      </Link>

      <BookHeader
        book={book}
        percent={progressPercent(book)}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {onWishlist && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/5 px-5 py-4">
          <p className="text-sm text-amber-100">
            This book is on your wishlist. Move it to your library once you've got it.
          </p>
          <button
            type="button"
            onClick={moveToLibrary}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Move to library
          </button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progress first on mobile: it is the most frequent interaction. */}
        <div className="space-y-6 lg:order-2">
          <section className={panelClass}>
            <h2 className="text-lg font-semibold text-slate-100">Progress</h2>
            <p className="mt-1 mb-4 text-sm text-slate-400">Log what you read — it feeds your stats.</p>

            <QuickLog book={book} />

            <details className="mt-4 rounded-xl border border-slate-800 p-3">
              <summary className="cursor-pointer text-sm text-slate-300 select-none">
                Edit status &amp; page count
              </summary>
              <div className="mt-4">
                <ProgressEditor
                  key={`${book.status}|${book.totalPages}|${book.pagesRead}`}
                  book={book}
                  onUpdate={handleUpdate}
                />
              </div>
            </details>

            <div className="mt-5">
              <SessionHistory book={book} />
            </div>
          </section>

          <section className={panelClass}>
            <h2 className="text-lg font-semibold text-slate-100">Action items</h2>
            <p className="mt-1 text-sm text-slate-400">
              Turn ideas into tasks you actually apply.
            </p>

            <div className="mt-5">
              <NewActionItemForm bookId={bookId} />
            </div>

            <div className="mt-6">
              <ActionItemsList bookId={bookId} />
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:order-1 lg:col-span-2">
          <section className={panelClass}>
            <h2 className="text-lg font-semibold text-slate-100">Notes &amp; Sections</h2>
            <p className="mt-1 text-sm text-slate-400">
              Structure your summary as sections, mark key insights and link related books.
            </p>

            <div className="mt-5">
              <NewNoteForm bookId={bookId} />
            </div>

            <div className="mt-6">
              <NotesList bookId={bookId} />
            </div>
          </section>

          {backlinks.length > 0 && (
            <section className={panelClass}>
              <h2 className="text-lg font-semibold text-slate-100">Referenced from other books</h2>
              <ul className="mt-3 space-y-2">
                {backlinks.map(({ from, note }) => (
                  <li key={note.id} className="text-sm">
                    <Link to={`/books/${from.id}`} className="font-medium text-indigo-300 hover:text-indigo-200">
                      {from.title}
                    </Link>
                    <span className="text-slate-400"> — {note.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
