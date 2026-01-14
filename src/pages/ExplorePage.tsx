import React, { useState, useEffect } from 'react';
import exploreService from "../services/exploreService";
import bookService from "../services/bookService";
import { useAuth } from "../lib/hooks/useAuth";

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

const ExplorePage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await exploreService.getTrendingBooks();
        setBooks(data);
      } catch (err) {
        setError('Failed to fetch books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await exploreService.searchBooks(query);
      setBooks(data);
    } catch (err) {
      setError('Failed to search books. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (book: Book) => {
    if (!user?.uid) {
      alert("You need to be logged in to add books to your library.");
      return;
    }

    try {
      await bookService.addBookToLibrary(user.uid, book);
      alert(`${book.title} has been added to your library.`);
    } catch (err) {
      alert(`Failed to add ${book.title} to your library. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
          Explore Books
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Discover trending books and search for your favorites.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search for books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg px-4 py-2 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-center text-slate-400">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {books.map((book) => (
          <div
            key={book.key}
            className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-black/20 backdrop-blur transition hover:border-indigo-500/30 hover:bg-slate-900/65"
          >
            <div className="flex gap-4">
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-indigo-500/30 to-indigo-600/10">
                {book.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <span className="text-lg font-semibold text-indigo-100/90">
                      {book.title?.charAt(0)?.toUpperCase() ?? "B"}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-100">
                  {book.title}
                </h3>
                <p className="mt-0.5 truncate text-sm text-slate-400">
                  {book.author_name?.join(", ")}
                </p>
              </div>
            </div>
            <button
              onClick={() => addToLibrary(book)}
              className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 transition"
            >
              Add to Library
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;