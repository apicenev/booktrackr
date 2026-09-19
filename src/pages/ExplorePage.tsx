import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
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
import { Spinner } from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { MagnifyingGlassIcon as MagnifyingGlassOutlineIcon } from "@heroicons/react/24/outline";
import { writeErrorMessage } from "../lib/firestoreUtils";

type AddState = "adding" | { error: string };

const TRENDING = "Trending today";

// Books added before openLibraryKey existed are matched by title + author.
const titleAuthorKey = (title: string, author: string) =>
  `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
const authorLabel = (book: ExploreBook) => book.authors.join(", ") || "Unknown";

function SkeletonCard() {
  return (
    <li aria-hidden="true" className="card flex gap-4 p-4">
      <div className="skeleton aspect-[2/3] w-20 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
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
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Explore Books</h1>
        <p className="page-lead">
          Find books on Open Library, then add them to your library or save them to your wishlist.
          Cover and page count are filled in automatically.
        </p>
      </div>

      <form onSubmit={handleSearch} role="search" className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
        />
        <input
          type="search"
          placeholder="Search by title, author or ISBN…"
          aria-label="Search Open Library"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-control border border-control bg-surface pr-4 pl-11 text-base text-ink shadow-card transition placeholder:text-ink-subtle focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
        />
        </div>
        <button
          type="submit"
          className="btn btn-primary h-11 px-5"
        >
          Search
        </button>
      </form>

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-title text-lg">{heading}</h2>
        {loading && (
          <p className="flex items-center gap-2 text-sm text-ink-subtle" aria-live="polite">
            <Spinner />
            {results.length ? "Updating…" : "Asking Open Library… this can take a few seconds"}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <EmptyState icon={MagnifyingGlassOutlineIcon} compact>No books found. Try a different search.</EmptyState>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showSkeleton && Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        {results.map((book) => {
          const existing = libraryMatch(book);
          const state = addState[book.key];
          const busy = state === "adding";
          return (
            <li
              key={book.key}
              className="card card-interactive flex flex-col p-4"
            >
              <div className="flex gap-4">
                <BookCover title={book.title} author={authorLabel(book)} coverId={book.coverId} size="md" />

                <div className="min-w-0 flex-1">
                  <h3 className="book-title line-clamp-3 text-base">{book.title}</h3>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{authorLabel(book)}</p>
                  <p className="mt-2 text-xs text-ink-subtle">
                    {[book.firstPublishYear, book.pages && `${book.pages} pages`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-4">
                {existing?.status === "wishlist" ? (
                  <>
                    <Link
                      to={`/books/${existing.id}`}
                      className="btn btn-sm flex-1 bg-warning-soft text-warning-ink hover:brightness-95"
                    >
                      <BookmarkIcon aria-hidden="true" className="size-4" />
                      On your wishlist
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => moveToLibrary(existing, book.key)}
                      className="btn btn-sm btn-primary"
                    >
                      Move to library
                    </button>
                  </>
                ) : existing ? (
                  <Link
                    to={`/books/${existing.id}`}
                    className="btn btn-sm flex-1 bg-success-soft text-success-ink hover:brightness-95"
                  >
                    <CheckIcon aria-hidden="true" className="size-4" />
                    In your library
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => add(book, "to-read")}
                      disabled={busy}
                      className="btn btn-sm btn-primary flex-1"
                    >
                      {busy ? "Adding…" : "Add to library"}
                    </button>
                    <button
                      type="button"
                      onClick={() => add(book, "wishlist")}
                      disabled={busy}
                      className="btn btn-sm btn-secondary"
                    >
                      Want to read
                    </button>
                  </>
                )}
              </div>
              {typeof state === "object" && (
                <p role="alert" className="mt-2 text-xs text-danger-ink">
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
