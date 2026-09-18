import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../lib/library/useLibrary";
import { isInLibrary, progressPercent } from "../domain/book";
import { currentStreak } from "../domain/stats";
import BookCover from "../components/book/BookCover";
import ProgressBar from "../components/book/ProgressBar";
import QuickLog from "../components/book/QuickLog";

const panelClass =
  "rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/20 backdrop-blur";

const DashboardPage = () => {
  const { books, notes, actionItems, sessions, booksLoaded, detailsLoaded, getBook, error } =
    useLibrary();

  const view = useMemo(() => {
    const library = books.filter(isInLibrary);
    const year = new Date().getFullYear();
    return {
      total: library.length,
      wishlist: books.length - library.length,
      reading: library
        .filter((b) => b.status === "reading")
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      finishedThisYear: library.filter(
        (b) => b.status === "finished" && b.finishedAt?.getFullYear() === year
      ).length,
      recentlyAdded: [...library].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5),
      openActions: actionItems
        .filter((a) => a.status === "open")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      streak: currentStreak(sessions, new Date()),
    };
  }, [books, actionItems, sessions]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-400">
        {error}
      </p>
    );
  }

  if (!booksLoaded) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading your dashboard…</p>;
  }

  // Knowledge counts appear once every book's notes/actions have loaded.
  const stats = [
    { label: "Books in library", value: view.total, to: "/library" },
    { label: "Currently reading", value: view.reading.length, to: "/library" },
    { label: `Finished in ${new Date().getFullYear()}`, value: view.finishedThisYear, to: "/stats" },
    { label: "Reading streak (days)", value: detailsLoaded ? view.streak : undefined, to: "/stats" },
    { label: "Notes", value: detailsLoaded ? notes.length : undefined, to: "/knowledge" },
    { label: "Open action items", value: detailsLoaded ? view.openActions.length : undefined, to: "/knowledge?kind=actions" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Dashboard</h1>

      {view.total === 0 ? (
        <section className={`${panelClass} text-center`}>
          <h2 className="text-lg font-semibold text-slate-100">Welcome to BookTrackr</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Add the book you are reading right now, then log your progress, capture notes and turn
            the best ideas into action items.
          </p>
          <Link
            to="/explore"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Find a book
          </Link>
          {view.wishlist > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Or move one from your{" "}
              <Link to="/wishlist" className="text-indigo-300 hover:text-indigo-200">
                wishlist
              </Link>
              .
            </p>
          )}
        </section>
      ) : (
        <>
          <section aria-label="Statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <Link key={s.label} to={s.to} className={`${panelClass} transition hover:border-indigo-500/30`}>
                <p className="text-2xl font-semibold text-slate-100">{s.value ?? "—"}</p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </Link>
            ))}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100">Continue reading</h2>
            {view.reading.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Nothing in progress.{" "}
                <Link to="/library" className="text-indigo-300 hover:text-indigo-200">
                  Pick your next book
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {view.reading.map((book) => {
                  const percent = progressPercent(book);
                  return (
                    <li key={book.id} className={panelClass}>
                      <Link to={`/books/${book.id}`} className="group flex gap-4">
                        <BookCover title={book.title} coverId={book.coverId} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-100 group-hover:text-indigo-200">
                            {book.title}
                          </p>
                          <p className="truncate text-sm text-slate-400">{book.author}</p>
                          {percent !== null ? (
                            <div className="mt-3">
                              <p className="mb-1 text-[11px] text-slate-500">
                                {percent}% · page {book.pagesRead ?? 0} of {book.totalPages}
                              </p>
                              <ProgressBar percent={percent} label={`Progress of ${book.title}`} />
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-slate-500">
                              Page {book.pagesRead ?? 0}
                            </p>
                          )}
                        </div>
                      </Link>
                      {/* Outside the link so the buttons stay valid, separate controls. */}
                      <div className="mt-3">
                        <QuickLog book={book} compact />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {detailsLoaded && view.openActions.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Next actions</h2>
                <Link to="/knowledge?kind=actions&status=open" className="text-sm text-slate-400 hover:text-slate-200">
                  All {view.openActions.length} →
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
                {view.openActions.slice(0, 3).map((action) => (
                  <li key={action.id}>
                    <Link
                      to={`/books/${action.bookId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-900/70"
                    >
                      <span className="min-w-0 text-slate-200">{action.description}</span>
                      <span className="shrink-0 truncate text-xs text-slate-500">
                        {getBook(action.bookId)?.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-slate-100">Recently added</h2>
            <ul className="mt-3 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
              {view.recentlyAdded.map((book) => (
                <li key={book.id}>
                  <Link
                    to={`/books/${book.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-900/70"
                  >
                    <span className="min-w-0 truncate text-slate-200">{book.title}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {book.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
