import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { useLibrary } from "../lib/library/useLibrary";
import { isInLibrary, progressPercent } from "../domain/book";
import { currentStreak } from "../domain/stats";
import BookCover from "../components/book/BookCover";
import ProgressBar from "../components/book/ProgressBar";
import QuickLog from "../components/book/QuickLog";
import LoadingState from "../components/ui/LoadingState";
import { BookOpenIcon } from "@heroicons/react/24/outline";

const panelClass = "card p-5";

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
      <p role="alert" className="alert-error">
        {error}
      </p>
    );
  }

  if (!booksLoaded) {
    return <LoadingState label="Loading your dashboard…" />;
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
    <div className="space-y-10">
      <h1 className="page-title">Dashboard</h1>

      {view.total === 0 ? (
        <section className="empty-state">
          <span aria-hidden="true" className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
            <BookOpenIcon className="size-6" strokeWidth={1.5} />
          </span>
          <h2 className="font-serif text-2xl font-semibold text-ink">Welcome to BookTrackr</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Add the book you are reading right now, then log your progress, capture notes and turn
            the best ideas into action items.
          </p>
          <Link
            to="/explore"
            className="btn btn-primary mt-6"
          >
            Find a book
          </Link>
          {view.wishlist > 0 && (
            <p className="mt-3 text-xs text-ink-subtle">
              Or move one from your{" "}
              <Link to="/wishlist" className="link">
                wishlist
              </Link>
              .
            </p>
          )}
        </section>
      ) : (
        <>
          <section aria-label="Statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <Link key={s.label} to={s.to} className="card card-interactive p-4">
                <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{s.value ?? "—"}</p>
                <p className="mt-1 text-xs leading-snug text-ink-muted">{s.label}</p>
              </Link>
            ))}
          </section>

          <section>
            <h2 className="section-title text-lg">Continue reading</h2>
            {view.reading.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Nothing in progress.{" "}
                <Link to="/library" className="link">
                  Pick your next book
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {view.reading.map((book) => {
                  const percent = progressPercent(book);
                  return (
                    <li key={book.id} className={panelClass}>
                      <Link to={`/books/${book.id}`} className="group flex gap-4">
                        <BookCover title={book.title} author={book.author} coverId={book.coverId} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="book-title line-clamp-2 text-lg group-hover:text-brand-ink">
                            {book.title}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-ink-muted">{book.author}</p>
                          {percent !== null ? (
                            <div className="mt-3">
                              <p className="mb-1.5 text-xs text-ink-subtle tabular-nums">
                                {percent}% · page {book.pagesRead ?? 0} of {book.totalPages}
                              </p>
                              <ProgressBar percent={percent} label={`Progress of ${book.title}`} />
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-ink-subtle">
                              Page {book.pagesRead ?? 0}
                            </p>
                          )}
                        </div>
                      </Link>
                      {/* Outside the link so the buttons stay valid, separate controls. */}
                      <div className="mt-4 border-t border-line pt-3">
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
                <h2 className="section-title text-lg">Next actions</h2>
                <Link to="/knowledge?kind=actions&status=open" className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
                  All {view.openActions.length}
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <ul className="card mt-4 divide-y divide-line overflow-hidden">
                {view.openActions.slice(0, 3).map((action) => (
                  <li key={action.id}>
                    <Link
                      to={`/books/${action.bookId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-sunken"
                    >
                      <span className="min-w-0 text-ink">{action.description}</span>
                      <span className="max-w-[40%] shrink-0 truncate text-xs text-ink-subtle">
                        {getBook(action.bookId)?.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="section-title text-lg">Recently added</h2>
            <ul className="card mt-4 divide-y divide-line overflow-hidden">
              {view.recentlyAdded.map((book) => (
                <li key={book.id}>
                  <Link
                    to={`/books/${book.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-sunken"
                  >
                    <span className="min-w-0 truncate font-medium text-ink">{book.title}</span>
                    <span className="shrink-0 text-xs text-ink-subtle tabular-nums">
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
