import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import type { Book } from "../../types/Book";

export interface NoteValues {
  title: string;
  content: string;
  tags: string[];
  isKeyInsight: boolean;
  linkedBookIds: string[];
}

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
    <form onSubmit={submit} className="grid grid-cols-1 gap-4">
      <label className="field">
        Heading
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="input"
          placeholder="Key Ideas / Chapter title / Concept"
        />
      </label>

      <label className="field">
        Summary
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="textarea"
          placeholder="Write the idea in your own words. Add examples, pitfalls, patterns…"
        />
      </label>

      <label className="field">
        Tags (optional, comma-separated)
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="input"
          placeholder="clean-architecture, testing, habits"
        />
      </label>

      {otherBooks.length > 0 && (
        <div className="field">
          <label className="block">
            Related books (optional)
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) setLinkedBookIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
              }}
              className="select"
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
                  className="inline-flex items-center gap-0.5 rounded-badge bg-brand-soft py-0.5 pr-0.5 pl-2 text-xs font-medium text-brand-ink"
                >
                  {b.title}
                  <button
                    type="button"
                    onClick={() => setLinkedBookIds((ids) => ids.filter((id) => id !== b.id))}
                    aria-label={`Remove link to ${b.title}`}
                    className="-my-1 grid size-6 cursor-pointer place-items-center rounded hover:bg-brand/15"
                  >
                    <XMarkIcon aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={isKeyInsight}
          onChange={(e) => setIsKeyInsight(e.target.checked)}
          className="size-4 shrink-0 cursor-pointer accent-warning"
        />
        Key insight — show it prominently in the knowledge library
      </label>

      {error && (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          className="btn btn-primary"
        >
          {saving ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
