import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import { updateActionItem } from "../services/actionItemService";
import {
  bookConnections,
  collectTags,
  searchKnowledge,
  type ActionFilter,
  type KnowledgeKind,
} from "../domain/knowledge";
import type { ActionItem } from "../types/ActionItem";

const KINDS: { key: KnowledgeKind; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "insights", label: "★ Key insights" },
  { key: "notes", label: "Notes" },
  { key: "actions", label: "Action items" },
];
const ACTION_FILTERS: { key: ActionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "done", label: "Done" },
];

const chipClass = (active: boolean) =>
  [
    "rounded-full px-3 py-1.5 text-sm ring-1 transition",
    active
      ? "bg-indigo-600 text-white ring-indigo-500/40"
      : "bg-slate-900/60 text-slate-200 ring-slate-800/80 hover:bg-slate-800/60",
  ].join(" ");

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps search words in <mark>. Text is rendered as React text, never as HTML. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-400/25 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function KnowledgePage() {
  const { user } = useAuth();
  const { books, notes, actionItems, detailsLoaded, error } = useLibrary();
  const [params, setParams] = useSearchParams();
  const [actionError, setActionError] = useState<string | null>(null);

  const query = params.get("q") ?? "";
  const kind = (KINDS.find((k) => k.key === params.get("kind"))?.key ?? "all") as KnowledgeKind;
  const tag = params.get("tag");
  const actionStatus = (ACTION_FILTERS.find((f) => f.key === params.get("status"))?.key ??
    "all") as ActionFilter;

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  const { books: matchingBooks, results } = useMemo(
    () => searchKnowledge({ books, notes, actionItems }, { query, kind, tag, actionStatus }),
    [books, notes, actionItems, query, kind, tag, actionStatus]
  );
  const tags = useMemo(() => collectTags(notes), [notes]);
  const connections = useMemo(() => bookConnections(notes, books), [notes, books]);
  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const toggleAction = async (action: ActionItem) => {
    if (!user?.uid) return;
    const nextStatus = action.status === "done" ? "open" : "done";
    setActionError(null);
    try {
      await updateActionItem(user.uid, action.bookId, action.id, {
        status: nextStatus,
        completedAt: nextStatus === "done" ? new Date() : undefined,
      });
    } catch (err) {
      console.error("Failed to update action item", err);
      setActionError("Could not update the action item. Please try again.");
    }
  };

  const filtering = Boolean(query || tag || kind !== "all" || actionStatus !== "all");
  const showConnections = !filtering && connections.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-5 shadow-lg shadow-black/20 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Knowledge library</h1>
        <p className="mt-1 text-sm text-slate-400">
          Every note, key insight and action item across your books — searchable in one place.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setParam("q", e.target.value || null)}
          placeholder="Search notes, insights, actions and books…"
          aria-label="Search knowledge library"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="What to show">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              aria-pressed={kind === k.key}
              onClick={() => setParam("kind", k.key === "all" ? null : k.key)}
              className={chipClass(kind === k.key)}
            >
              {k.label}
            </button>
          ))}
          {(kind === "all" || kind === "actions") && !tag && (
            <select
              value={actionStatus}
              onChange={(e) => setParam("status", e.target.value === "all" ? null : e.target.value)}
              aria-label="Action item status"
              className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200"
            >
              {ACTION_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  Actions: {f.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
            {tags.map(({ tag: t, count }) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setParam("tag", tag === t ? null : t)}
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs ring-1 transition",
                  tag === t
                    ? "bg-indigo-600 text-white ring-indigo-500/40"
                    : "bg-slate-900/40 text-slate-300 ring-slate-700/70 hover:ring-slate-500",
                ].join(" ")}
              >
                #{t} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-red-400">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : !detailsLoaded ? (
        <p className="text-sm text-slate-400 animate-pulse">Loading your knowledge library…</p>
      ) : (
        <>
          {matchingBooks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Books</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {matchingBooks.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/books/${b.id}`}
                      className="inline-block rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-200 ring-1 ring-slate-800 hover:ring-indigo-500/40"
                    >
                      <Highlight text={b.title} query={query} />
                      <span className="text-slate-500"> · {b.author}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-live="polite">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {results.length} {results.length === 1 ? "result" : "results"}
            </h2>
            {results.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                {notes.length + actionItems.length === 0
                  ? "Nothing captured yet. Open a book to add notes, key insights and action items."
                  : "Nothing matches these filters."}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {results.map((r) =>
                  r.type === "note" ? (
                    <li
                      key={`n-${r.note.id}`}
                      className={`rounded-2xl border bg-slate-900/40 p-4 ${
                        r.note.isKeyInsight ? "border-amber-400/30" : "border-slate-800"
                      }`}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {r.note.isKeyInsight ? (
                          <span className="text-amber-300">★ Key insight</span>
                        ) : (
                          "Note"
                        )}{" "}
                        ·{" "}
                        <Link to={`/books/${r.book.id}`} className="normal-case text-indigo-300 hover:text-indigo-200">
                          {r.book.title}
                        </Link>
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-100">
                        <Highlight text={r.note.title} query={query} />
                      </h3>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-slate-300">
                        <Highlight text={r.note.content} query={query} />
                      </p>
                      {(r.note.tags?.length || r.note.linkedBookIds?.length) ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {r.note.tags?.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setParam("tag", t)}
                              className="rounded-full bg-slate-900/40 px-2 py-0.5 text-slate-300 ring-1 ring-slate-700/70 hover:ring-slate-500"
                            >
                              #{t}
                            </button>
                          ))}
                          {r.note.linkedBookIds
                            ?.map((id) => bookById.get(id))
                            .filter((b) => b !== undefined)
                            .map((b) => (
                              <Link
                                key={b.id}
                                to={`/books/${b.id}`}
                                className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-200 ring-1 ring-indigo-400/30"
                              >
                                ↔ {b.title}
                              </Link>
                            ))}
                        </div>
                      ) : null}
                    </li>
                  ) : (
                    <li
                      key={`a-${r.action.id}`}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
                    >
                      <label className="flex min-w-0 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={r.action.status === "done"}
                          onChange={() => toggleAction(r.action)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                        />
                        <span
                          className={`text-sm ${
                            r.action.status === "done" ? "text-slate-400 line-through" : "text-slate-200"
                          }`}
                        >
                          <Highlight text={r.action.description} query={query} />
                        </span>
                      </label>
                      <Link
                        to={`/books/${r.book.id}`}
                        className="shrink-0 truncate text-xs text-indigo-300 hover:text-indigo-200"
                      >
                        {r.book.title}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          {showConnections && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Connections between books
              </h2>
              <ul className="mt-3 space-y-2">
                {connections.map(({ from, to, note }) => (
                  <li key={`${note.id}-${to.id}`} className="text-sm text-slate-300">
                    <Link to={`/books/${from.id}`} className="text-indigo-300 hover:text-indigo-200">
                      {from.title}
                    </Link>{" "}
                    <span className="text-slate-500">↔</span>{" "}
                    <Link to={`/books/${to.id}`} className="text-indigo-300 hover:text-indigo-200">
                      {to.title}
                    </Link>
                    <span className="text-slate-500"> via “{note.title}”</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
