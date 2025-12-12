import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/hooks/useAuth";
import type { Book } from "../types/Book";
import { getBook, updateBook, cascadeDeleteBook } from "../services/bookService";

import BookHeader from "../components/book/BookHeader";
import ProgressEditor from "../components/book/ProgressEditor";
import NotesList from "../components/book/NotesList";
import NewNoteForm from "../components/book/NewNoteForm";
import ActionItemsList from "../components/book/ActionItemsList";
import NewActionItemForm from "../components/book/NewActionItemForm";

export default function BookDetailPage() {
  const { id: bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refresh helper (used after updates)
  const refreshBook = async () => {
    if (!user?.uid || !bookId) return;
    const b = await getBook(user.uid, bookId);
    setBook(b);
  };

  useEffect(() => {
    if (!user?.uid || !bookId) return;

    setLoading(true);
    setError(null);

    getBook(user.uid, bookId)
      .then((b) => {
        setBook(b);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to load book.");
        setLoading(false);
      });
  }, [user?.uid, bookId]);

  const percent = useMemo(() => {
    if (!book?.totalPages || !book.pagesRead || book.totalPages <= 0) return null;
    const raw = (book.pagesRead / book.totalPages) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }, [book?.pagesRead, book?.totalPages]);

  const handleDelete = async () => {
    if (!user?.uid || !bookId) return;
    const ok = window.confirm("Delete this book and all its notes/actions/sessions?");
    if (!ok) return;

    await cascadeDeleteBook(user.uid, bookId);
    navigate("/library");
  };

  const handleUpdate = async (patch: Partial<Book>) => {
    if (!user?.uid || !bookId) return;
    await updateBook(user.uid, bookId, patch);
    await refreshBook();
  };

  if (!bookId) return <Navigate to="/library" replace />;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-lg shadow-black/20 backdrop-blur">
        <p className="text-sm text-slate-400 animate-pulse">Loading book…</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-lg shadow-black/20 backdrop-blur">
        <p className="text-sm text-red-400">
          {error ?? "Book not found."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/library")}
          className="mt-4 rounded-xl bg-slate-900/60 px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-800/80 transition hover:bg-slate-800/60"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookHeader book={book} percent={percent} onDelete={handleDelete} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Documentation */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/20 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Notes & Sections</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Structure your summary as sections (like headings from the book).
                </p>
              </div>
            </div>

            <div className="mt-5">
              <NewNoteForm bookId={bookId} />
            </div>

            <div className="mt-6">
              <NotesList bookId={bookId} />
            </div>
          </div>
        </div>

        {/* Right: Progress + Action items */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/20 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-100">Progress</h2>
            <p className="mt-1 text-sm text-slate-400">
              Track pages and status — keep it honest, keep it simple.
            </p>

            <div className="mt-5">
              <ProgressEditor book={book} onUpdate={handleUpdate} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/20 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-100">Action items</h2>
            <p className="mt-1 text-sm text-slate-400">
              Turn ideas into tasks. Link them to GitHub if you apply them in projects.
            </p>

            <div className="mt-5">
              <NewActionItemForm bookId={bookId} />
            </div>

            <div className="mt-6">
              <ActionItemsList bookId={bookId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
