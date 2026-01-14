// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { listenToBooks } from "../services/bookService";
// import { useAuth } from "../lib/hooks/useAuth";
// import type { Book, BookStatus } from "../types/Book";

// type BookFilter = "all" | BookStatus;

// const FILTERS: { key: BookFilter; label: string }[] = [
//   { key: "all", label: "All" },
//   { key: "to-read", label: "To Read" },
//   { key: "reading", label: "Reading" },
//   { key: "finished", label: "Finished" },
// ];

// const statusPillClasses: Record<BookStatus, string> = {
//   "to-read": "bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/50",
//   reading: "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30",
//   finished: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
// };

// const prettyStatus: Record<BookStatus, string> = {
//   "to-read": "to read",
//   reading: "reading",
//   finished: "finished",
// };

// export default function LibraryPage() {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [books, setBooks] = useState<Book[]>([]);
//   const [filter, setFilter] = useState<BookFilter>("all");

//   useEffect(() => {
//     if (!user?.uid) return;

//     const unsubscribe = listenToBooks(user.uid, (next) => setBooks(next));
//     return () => unsubscribe();
//   }, [user?.uid]);

//   const filteredBooks = useMemo(() => {
//     if (filter === "all") return books;
//     return books.filter((b) => b.status === filter);
//   }, [books, filter]);

//   const emptyCopy =
//     filter === "all"
//       ? "No books yet. Add your first one to start tracking."
//       : `No books in “${FILTERS.find((f) => f.key === filter)?.label}”.`;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
//         <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
//           Your Library
//         </h1>
//         <p className="mt-1 text-sm text-slate-400">
//           Browse your books, jump into details, and capture insights.
//         </p>
//       </div>

//       {/* Filters + Add button */}
//       <div className="flex items-center justify-between gap-4">
//         <div className="flex flex-wrap items-center gap-2">
//           {FILTERS.map((f) => {
//             const active = filter === f.key;
//             return (
//               <button
//                 key={f.key}
//                 type="button"
//                 onClick={() => setFilter(f.key)}
//                 className={[
//                   "rounded-full px-4 py-2 text-sm transition cursor-pointer",
//                   "ring-1 ring-slate-800/80",
//                   active
//                     ? "bg-indigo-600 text-white ring-indigo-500/40"
//                     : "bg-slate-900/60 text-slate-200 hover:bg-slate-800/60",
//                 ].join(" ")}
//               >
//                 {f.label}
//               </button>
//             );
//           })}
//         </div>

//         <button
//           type="button"
//           onClick={() => navigate("/library/new")}
//           aria-label="Add book"
//           className={[
//             "h-10 w-10 shrink-0 rounded-full cursor-pointer",
//             "bg-indigo-600 text-white",
//             "grid place-items-center",
//             "shadow-lg shadow-indigo-600/20",
//             "transition hover:bg-indigo-500",
//             "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
//           ].join(" ")}
//         >
//           <span className="text-xl leading-none">+</span>
//         </button>
//       </div>

//       {/* Grid */}
//       {filteredBooks.length === 0 ? (
//         <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
//           <p className="text-sm text-slate-400">{emptyCopy}</p>
//           <p className="mt-2 text-xs text-slate-500">
//             Tip: you can start with title + author and fill details later.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {filteredBooks.map((book) => (
//             <button
//               key={book.id}
//               type="button"
//               onClick={() => navigate(`/books/${book.id}`)}
//               className={[
//                 "group text-left",
//                 "rounded-2xl border border-slate-800 bg-slate-900/50 p-4",
//                 "shadow-lg shadow-black/20 backdrop-blur",
//                 "transition hover:border-indigo-500/30 hover:bg-slate-900/65",
//                 "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
//               ].join(" ")}
//             >
//               <div className="flex gap-4">
//                 {/* Smaller cover thumbnail */}
//                 <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-indigo-500/30 to-indigo-600/10">
//                   {/* If you later add coverUrl to the real Book type, swap this accordingly */}
//                   <div className="grid h-full w-full place-items-center">
//                     <span className="text-lg font-semibold text-indigo-100/90">
//                       {book.title?.charAt(0)?.toUpperCase() ?? "B"}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <h3 className="truncate text-base font-semibold text-slate-100">
//                         {book.title}
//                       </h3>
//                       <p className="mt-0.5 truncate text-sm text-slate-400">
//                         {book.author}
//                       </p>
//                     </div>

//                     <span
//                       className={[
//                         "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
//                         statusPillClasses[book.status],
//                       ].join(" ")}
//                     >
//                       {prettyStatus[book.status]}
//                     </span>
//                   </div>

//                   {/* Optional progress line */}
//                   {typeof book.totalPages === "number" &&
//                   typeof book.pagesRead === "number" &&
//                   book.totalPages > 0 ? (
//                     <div className="mt-3">
//                       <div className="flex items-center justify-between text-[11px] text-slate-500">
//                         <span>Progress</span>
//                         <span>
//                           {Math.min(book.pagesRead, book.totalPages)}/
//                           {book.totalPages}
//                         </span>
//                       </div>
//                       <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
//                         <div
//                           className="h-full rounded-full bg-indigo-500/80"
//                           style={{
//                             width: `${Math.min(
//                               100,
//                               (book.pagesRead / book.totalPages) * 100
//                             )}%`,
//                           }}
//                         />
//                       </div>
//                     </div>
//                   ) : (
//                     <p className="mt-3 text-xs text-slate-500">
//                       Open to add notes, action items, and progress.
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listenToBooks, deleteBook } from "../services/bookService";
import { useAuth } from "../lib/hooks/useAuth";
import type { Book, BookStatus } from "../types/Book";

type BookFilter = "all" | BookStatus;

const FILTERS: { key: BookFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "to-read", label: "To Read" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
];

const statusPillClasses: Record<BookStatus, string> = {
  "to-read": "bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/50",
  reading: "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30",
  finished: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
};

const prettyStatus: Record<BookStatus, string> = {
  "to-read": "to read",
  reading: "reading",
  finished: "finished",
};

export default function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<BookFilter>("all");

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenToBooks(user.uid, setBooks);
    return () => unsubscribe();
  }, [user?.uid]);

  const filteredBooks = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.status === filter);
  }, [books, filter]);

  const handleDelete = async (
    e: React.MouseEvent,
    bookId: string
  ) => {
    e.stopPropagation();
    if (!user?.uid) return;

    const confirmed = window.confirm(
      "Remove this book from your library?"
    );
    if (!confirmed) return;

    await deleteBook(user.uid, bookId);
  };

  const emptyCopy =
    filter === "all"
      ? "No books yet. Add your first one to start tracking."
      : `No books in “${FILTERS.find((f) => f.key === filter)?.label}”.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
          Your Library
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse your books, jump into details, and capture insights.
        </p>
      </div>

      {/* Filters + Add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={[
                  "rounded-full px-4 py-2 text-sm transition cursor-pointer",
                  "ring-1 ring-slate-800/80",
                  active
                    ? "bg-indigo-600 text-white ring-indigo-500/40"
                    : "bg-slate-900/60 text-slate-200 hover:bg-slate-800/60",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate("/library/new")}
          aria-label="Add book"
          className={[
            "h-10 w-10 shrink-0 rounded-full cursor-pointer",
            "bg-indigo-600 text-white",
            "grid place-items-center",
            "shadow-lg shadow-indigo-600/20",
            "transition hover:bg-indigo-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
          ].join(" ")}
        >
          <span className="text-xl leading-none">+</span>
        </button>
      </div>

      {/* Grid */}
      {filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-sm text-slate-400">{emptyCopy}</p>
          <p className="mt-2 text-xs text-slate-500">
            Tip: you can start with title + author and fill details later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => navigate(`/books/${book.id}`)}
              className={[
                "group relative text-left cursor-pointer",
                "rounded-2xl border border-slate-800 bg-slate-900/50 p-4",
                "shadow-lg shadow-black/20 backdrop-blur",
                "transition hover:border-indigo-500/30 hover:bg-slate-900/65",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
              ].join(" ")}
            >
              <div className="flex gap-4">
                {/* Cover thumbnail */}
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-indigo-500/30 to-indigo-600/10">
                  {book.coverId ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <span className="text-lg font-semibold text-indigo-100/90">
                        {book.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-100">
                        {book.title}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-slate-400">
                        {book.author}
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        statusPillClasses[book.status],
                      ].join(" ")}
                    >
                      {prettyStatus[book.status]}
                    </span>
                  </div>

                  {typeof book.totalPages === "number" &&
                  typeof book.pagesRead === "number" &&
                  book.totalPages > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Progress</span>
                        <span>
                          {Math.min(book.pagesRead, book.totalPages)}/
                          {book.totalPages}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500/80"
                          style={{
                            width: `${Math.min(
                              100,
                              (book.pagesRead / book.totalPages) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Open to add notes, action items, and progress.
                    </p>
                  )}
                </div>
              </div>

              {/* Trash button */}
              <button
                type="button"
                onClick={(e) => handleDelete(e, book.id)}
                aria-label="Delete book"
                className={[
                  "absolute bottom-3 right-3 cursor-pointer",
                  "h-8 w-8 rounded-full",
                  "bg-slate-800/80 text-slate-300",
                  "grid place-items-center",
                  "opacity-0 group-hover:opacity-100",
                  "transition hover:bg-red-600 hover:text-white",
                  "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/40",
                ].join(" ")}
              >
                🗑️
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
