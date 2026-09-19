import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
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
import LoadingState from "../components/ui/LoadingState";

const panelClass = "panel";

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
        <p role="alert" className="msg-error">{error}</p>
      </div>
    );
  }

  if (!booksLoaded || deleting) {
    return (
      <div className={panelClass}>
        <LoadingState label={deleting ? "Deleting book…" : "Loading book…"} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className={panelClass}>
        <p className="text-sm text-ink-muted">Book not found.</p>
        <Link
          to="/library"
          className="btn btn-secondary mt-4"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  const onWishlist = book.status === "wishlist";

  return (
    <div className="space-y-8">
      <Link
        to={onWishlist ? "/wishlist" : "/library"}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        {onWishlist ? "Wishlist" : "Library"}
      </Link>

      <BookHeader
        book={book}
        percent={progressPercent(book)}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {onWishlist && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning/30 bg-warning-soft px-5 py-4">
          <p className="text-sm text-warning-ink">
            This book is on your wishlist. Move it to your library once you've got it.
          </p>
          <button
            type="button"
            onClick={moveToLibrary}
            className="btn btn-primary"
          >
            Move to library
          </button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="alert-error">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progress first on mobile: it is the most frequent interaction. */}
        <div className="space-y-6 lg:order-2">
          <section className={panelClass}>
            <h2 className="section-title text-lg">Progress</h2>
            <p className="section-lead mb-5">Log what you read — it feeds your stats.</p>

            <QuickLog book={book} />

            <details className="well group mt-5 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium select-none hover:text-ink [&::-webkit-details-marker]:hidden text-sm text-ink-muted">
                <ChevronRightIcon aria-hidden="true" className="size-4 transition-transform group-open:rotate-90" />
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
            <h2 className="section-title text-lg">Action items</h2>
            <p className="section-lead">
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
            <h2 className="section-title text-lg">Notes &amp; Sections</h2>
            <p className="section-lead">
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
              <h2 className="section-title text-lg">Referenced from other books</h2>
              <ul className="mt-3 space-y-2">
                {backlinks.map(({ from, note }) => (
                  <li key={note.id} className="text-sm">
                    <Link to={`/books/${from.id}`} className="link font-serif">
                      {from.title}
                    </Link>
                    <span className="text-ink-muted"> — {note.title}</span>
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
