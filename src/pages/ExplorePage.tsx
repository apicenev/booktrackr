import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCachedSearch,
  getCachedTrending,
  getTrendingBooks,
  searchBooks,
  type ExploreBook,
} from "../services/exploreService";
import { createBook, updateBook } from "../services/bookService";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import type { Book, BookStatus } from "../types/Book";
import BookCover from "../components/book/BookCover";
import { writeErrorMessage } from "../lib/firestoreUtils";

type AddState = "adding" | { error: string };

const TRENDING = "Trending today";

// Books added before openLibraryKey existed are matched by title + author.
const titleAuthorKey = (title: string, author: string) =>
  `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
const authorLabel = (book: ExploreBook) => book.authors.join(", ") || "Unknown";

function SkeletonCard() {
  return (
    <li aria-hidden="true" className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="h-24 w-16 shrink-0 animate-pulse rounded-xl bg-slate-800" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
      </div>
    </li>
  );
}

const ExplorePage = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const { books: library } = useLibrary();

  const [cachedTrending] = useState(() => getCachedTrending());
  const [results, setResults] = useState<ExploreBook[]>(cachedTrending?.books ?? []);
  const [heading, setHeading] = useState(TRENDING);
  const [loading, setLoading] = useState(!cachedTrending?.fresh);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addState, setAddState] = useState<Record<string, AddState>>({});
  const requestRef = useRef<AbortController | null>(null);

  // Runs a request, cancelling any in-flight one so stale results never win.
  const load = async (label: string, fetcher: (signal: AbortSignal) => Promise<ExploreBook[]>) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const books = await fetcher(controller.signal);
      setResults(books);
      setHeading(label);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Open Library request failed", err);
      setError("Could not reach Open Library. Please try again later.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    // Cached trending (from an earlier visit) renders instantly; refresh it in
    // the background once it is older than a few hours.
    if (!cachedTrending?.fresh) load(TRENDING, getTrendingBooks);
    return () => requestRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  const libraryMatch = useMemo(() => {
    const byKey = new Map<string, Book>();
    for (const b of library) {
      if (b.openLibraryKey) byKey.set(b.openLibraryKey, b);
      byKey.set(titleAuthorKey(b.title, b.author), b);
    }
    return (book: ExploreBook) =>
      byKey.get(book.key) ?? byKey.get(titleAuthorKey(book.title, authorLabel(book)));
  }, [library]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) {
      const cached = getCachedTrending();
      if (cached) {
        requestRef.current?.abort();
        setResults(cached.books);
        setHeading(TRENDING);
        setLoading(false);
        if (cached.fresh) return;
      }
      load(TRENDING, getTrendingBooks);
      return;
    }

    const label = `Results for “${term}”`;
    const cached = getCachedSearch(term);
    if (cached) {
      requestRef.current?.abort();
      setResults(cached);
      setHeading(label);
      setLoading(false);
      setError(null);
      return;
    }
    load(label, (signal) => searchBooks(term, signal));
  };

  const add = async (book: ExploreBook, status: BookStatus) => {
    if (!uid) return;
    setAddState((s) => ({ ...s, [book.key]: "adding" }));
    try {
      await createBook(uid, {
        title: book.title,
        author: authorLabel(book),
        status,
        totalPages: book.pages,
        coverId: book.coverId,
        openLibraryKey: book.key,
      });
      // The library listener marks the book as added.
      setAddState((s) => {
        const next = { ...s };
        delete next[book.key];
        return next;
      });
    } catch (err) {
      console.error("Failed to add book", err);
      setAddState((s) => ({ ...s, [book.key]: { error: writeErrorMessage(err) } }));
    }
  };

  const moveToLibrary = async (book: Book, key: string) => {
    if (!uid) return;
    setAddState((s) => ({ ...s, [key]: "adding" }));
    try {
      await updateBook(uid, book.id, { status: "to-read" });
      setAddState((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    } catch (err) {
      console.error("Failed to move book to library", err);
      setAddState((s) => ({ ...s, [key]: { error: writeErrorMessage(err) } }));
    }
  };

  const showSkeleton = loading && results.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Explore Books</h1>
        <p className="mt-1 text-sm text-slate-400">
          Find books on Open Library, then add them to your library or save them to your wishlist.
          Cover and page count are filled in automatically.
        </p>
      </div>

      <form onSubmit={handleSearch} role="search" className="flex items-center gap-2">
        <input
          type="search"
          placeholder="Search by title, author or ISBN…"
          aria-label="Search Open Library"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white transition hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">{heading}</h2>
        {loading && (
          <p className="text-sm text-slate-400 animate-pulse" aria-live="polite">
            {results.length ? "Updating…" : "Asking Open Library… this can take a few seconds"}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-sm text-slate-400">No books found. Try a different search.</p>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {showSkeleton && Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        {results.map((book) => {
          const existing = libraryMatch(book);
          const state = addState[book.key];
          const busy = state === "adding";
          return (
            <li
              key={book.key}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg shadow-black/20 backdrop-blur"
            >
              <div className="flex gap-4">
                <BookCover title={book.title} coverId={book.coverId} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-100">{book.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-slate-400">{authorLabel(book)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[book.firstPublishYear, book.pages && `${book.pages} pages`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {existing?.status === "wishlist" ? (
                  <>
                    <Link
                      to={`/books/${existing.id}`}
                      className="flex-1 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200 ring-1 ring-amber-400/30"
                    >
                      ★ On your wishlist
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => moveToLibrary(existing, book.key)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      Move to library
                    </button>
                  </>
                ) : existing ? (
                  <Link
                    to={`/books/${existing.id}`}
                    className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-200 ring-1 ring-emerald-400/30"
                  >
                    ✓ In your library
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => add(book, "to-read")}
                      disabled={busy}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {busy ? "Adding…" : "Add to library"}
                    </button>
                    <button
                      type="button"
                      onClick={() => add(book, "wishlist")}
                      disabled={busy}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700 disabled:opacity-60"
                    >
                      Want to read
                    </button>
                  </>
                )}
              </div>
              {typeof state === "object" && (
                <p role="alert" className="mt-2 text-xs text-red-400">
                  {state.error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExplorePage;
