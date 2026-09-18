import { useMemo, useState } from "react";
import type { Book } from "../../types/Book";

export interface NoteValues {
  title: string;
  content: string;
  tags: string[];
  isKeyInsight: boolean;
  linkedBookIds: string[];
}

const inputClass =
  "mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

/** Comma-separated input -> unique, lower-case tags. */
const parseTags = (input: string): string[] => [
  ...new Set(
    input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  ),
];

/** Shared by "new section" and inline editing of an existing note. */
export default function NoteForm({
  bookId,
  books,
  initial,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
}: {
  /** The book the note belongs to (excluded from related books). */
  bookId: string;
  books: Book[];
  initial?: Partial<NoteValues>;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: NoteValues) => Promise<void>;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [isKeyInsight, setIsKeyInsight] = useState(initial?.isKeyInsight ?? false);
  const [linkedBookIds, setLinkedBookIds] = useState<string[]>(initial?.linkedBookIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherBooks = useMemo(
    () => books.filter((b) => b.id !== bookId).sort((a, b) => a.title.localeCompare(b.title)),
    [books, bookId]
  );
  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  // Links to books that were deleted in the meantime are dropped on save.
  const linkedBooks = linkedBookIds.map((id) => bookById.get(id)).filter((b): b is Book => Boolean(b));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: parseTags(tags),
        isKeyInsight,
        linkedBookIds: linkedBooks.map((b) => b.id),
      });
      if (resetOnSubmit) {
        setTitle("");
        setContent("");
        setTags("");
        setIsKeyInsight(false);
        setLinkedBookIds([]);
      }
    } catch (err) {
      console.error("Failed to save note", err);
      setError("Failed to save the section. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3">
      <label className="block text-xs font-medium text-slate-400">
        Heading
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className={inputClass}
          placeholder="Key Ideas / Chapter title / Concept"
        />
      </label>

      <label className="block text-xs font-medium text-slate-400">
        Summary
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${inputClass} min-h-[110px]`}
          placeholder="Write the idea in your own words. Add examples, pitfalls, patterns…"
        />
      </label>

      <label className="block text-xs font-medium text-slate-400">
        Tags (optional, comma-separated)
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={inputClass}
          placeholder="clean-architecture, testing, habits"
        />
      </label>

      {otherBooks.length > 0 && (
        <div className="text-xs font-medium text-slate-400">
          <label className="block">
            Related books (optional)
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) setLinkedBookIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
              }}
              className={inputClass}
            >
              <option value="">Link a book this idea connects to…</option>
              {otherBooks
                .filter((b) => !linkedBookIds.includes(b.id))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.author}
                  </option>
                ))}
            </select>
          </label>
          {linkedBooks.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {linkedBooks.map((b) => (
                <li
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 py-0.5 pl-2.5 pr-1 text-[11px] text-indigo-200 ring-1 ring-indigo-400/30"
                >
                  {b.title}
                  <button
                    type="button"
                    onClick={() => setLinkedBookIds((ids) => ids.filter((id) => id !== b.id))}
                    aria-label={`Remove link to ${b.title}`}
                    className="grid h-4 w-4 place-items-center rounded-full hover:bg-indigo-400/20"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isKeyInsight}
          onChange={(e) => setIsKeyInsight(e.target.checked)}
          className="h-4 w-4 accent-amber-400"
        />
        Key insight — show it prominently in the knowledge library
      </label>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
