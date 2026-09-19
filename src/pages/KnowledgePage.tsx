import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowsRightLeftIcon, LinkIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/16/solid";
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
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { LightBulbIcon } from "@heroicons/react/24/outline";

const KINDS: { key: KnowledgeKind; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "insights", label: "Key insights" },
  { key: "notes", label: "Notes" },
  { key: "actions", label: "Action items" },
];
const ACTION_FILTERS: { key: ActionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "done", label: "Done" },
];

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
          <mark key={i} className="rounded-sm bg-warning/20 px-0.5 text-inherit">
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
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Knowledge library</h1>
        <p className="page-lead">
          Every note, key insight and action item across your books — searchable in one place.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setParam("q", e.target.value || null)}
          placeholder="Search notes, insights, actions and books…"
          aria-label="Search knowledge library"
          className="h-11 w-full rounded-control border border-control bg-surface pr-4 pl-11 text-base text-ink shadow-card transition placeholder:text-ink-subtle focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
        />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="What to show">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              aria-pressed={kind === k.key}
              onClick={() => setParam("kind", k.key === "all" ? null : k.key)}
              className="chip"
            >
              {k.key === "insights" && <StarIcon aria-hidden="true" className="size-3.5" />}
              {k.label}
            </button>
          ))}
          {(kind === "all" || kind === "actions") && !tag && (
            <select
              value={actionStatus}
              onChange={(e) => setParam("status", e.target.value === "all" ? null : e.target.value)}
              aria-label="Action item status"
              className="h-8 cursor-pointer rounded-control border border-line bg-surface px-3 text-sm text-ink-muted transition hover:border-line-strong focus:border-brand focus:outline-none"
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
                className="chip h-7 px-2.5 text-xs"
              >
                #{t} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {actionError && (
        <p role="alert" className="alert-error">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : !detailsLoaded ? (
        <LoadingState label="Loading your knowledge library…" />
      ) : (
        <>
          {matchingBooks.length > 0 && (
            <section>
              <h2 className="eyebrow">Books</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {matchingBooks.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/books/${b.id}`}
                      className="card card-interactive inline-block px-3 py-2 font-serif text-sm font-semibold text-ink"
                    >
                      <Highlight text={b.title} query={query} />
                      <span className="font-sans font-normal text-ink-subtle"> · {b.author}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-live="polite">
            <h2 className="eyebrow">
              {results.length} {results.length === 1 ? "result" : "results"}
            </h2>
            {results.length === 0 ? (
              <EmptyState icon={LightBulbIcon} compact className="mt-3">
                {notes.length + actionItems.length === 0
                  ? "Nothing captured yet. Open a book to add notes, key insights and action items."
                  : "Nothing matches these filters."}
              </EmptyState>
            ) : (
              <ul className="mt-3 space-y-3">
                {results.map((r) =>
                  r.type === "note" ? (
                    <li
                      key={`n-${r.note.id}`}
                      className={`card p-5 ${
                        r.note.isKeyInsight ? "border-warning/40 shadow-[inset_3px_0_0_var(--color-warning)]" : ""
                      }`}
                    >
                      <p className="eyebrow">
                        {r.note.isKeyInsight ? (
                          <span className="inline-flex items-center gap-1 text-warning-ink">
                            <StarIcon aria-hidden="true" className="size-3.5" />
                            Key insight
                          </span>
                        ) : (
                          "Note"
                        )}{" "}
                        ·{" "}
                        <Link to={`/books/${r.book.id}`} className="font-serif tracking-normal text-brand normal-case hover:underline">
                          {r.book.title}
                        </Link>
                      </p>
                      <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-ink">
                        <Highlight text={r.note.title} query={query} />
                      </h3>
                      <p className="mt-1.5 line-clamp-4 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                        <Highlight text={r.note.content} query={query} />
                      </p>
                      {(r.note.tags?.length || r.note.linkedBookIds?.length) ? (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                          {r.note.tags?.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setParam("tag", t)}
                              className="tag cursor-pointer"
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
                                className="inline-flex items-center gap-1 rounded-badge bg-brand-soft px-2 py-0.5 font-medium text-brand-ink hover:bg-brand/15"
                              >
                                <LinkIcon aria-hidden="true" className="size-3" />
                                {b.title}
                              </Link>
                            ))}
                        </div>
                      ) : null}
                    </li>
                  ) : (
                    <li
                      key={`a-${r.action.id}`}
                      className="card flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <label className="flex min-w-0 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={r.action.status === "done"}
                          onChange={() => toggleAction(r.action)}
                          className="checkbox mt-0.5 accent-success"
                        />
                        <span
                          className={`text-sm ${
                            r.action.status === "done" ? "text-ink-subtle line-through" : "text-ink"
                          }`}
                        >
                          <Highlight text={r.action.description} query={query} />
                        </span>
                      </label>
                      <Link
                        to={`/books/${r.book.id}`}
                        className="max-w-[40%] shrink-0 truncate font-serif text-xs text-brand hover:underline"
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
              <h2 className="eyebrow">
                Connections between books
              </h2>
              <ul className="mt-3 space-y-2">
                {connections.map(({ from, to, note }) => (
                  <li key={`${note.id}-${to.id}`} className="text-sm text-ink-muted">
                    <Link to={`/books/${from.id}`} className="link font-serif">
                      {from.title}
                    </Link>{" "}
                    <ArrowsRightLeftIcon aria-hidden="true" className="inline size-3.5 align-[-2px] text-ink-subtle" />
                    <span className="sr-only">linked with</span>{" "}
                    <Link to={`/books/${to.id}`} className="link font-serif">
                      {to.title}
                    </Link>
                    <span className="text-ink-subtle"> via “{note.title}”</span>
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
