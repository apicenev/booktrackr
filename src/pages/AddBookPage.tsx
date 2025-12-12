import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../services/bookService";
import { useAuth } from "../lib/hooks/useAuth";
import type { BookStatus, NewBookInput } from "../types/Book";

export default function AddBookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<BookStatus>("to-read");
  const [totalPages, setTotalPages] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const payload: NewBookInput = {
        title: title.trim(),
        author: author.trim(),
        status,
        totalPages: totalPages ? Number(totalPages) : undefined,
      };

      await createBook(user.uid, payload);
      navigate("/library");
    } catch (err) {
      setError("Failed to add book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
          Add a new book
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Start with the basics — you can enrich details later.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg shadow-black/20 backdrop-blur space-y-5"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Clean Code"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Author
          </label>
          <input
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Robert C. Martin"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Reading status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookStatus)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="to-read">To read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
          </select>
        </div>

        {/* Total pages */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Total pages <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="320"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate("/library")}
            className="text-sm text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium",
              "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20",
              "transition hover:bg-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? "Adding…" : "Add book"}
          </button>
        </div>
      </form>
    </div>
  );
}
