import { useState } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { createNote } from "../../services/noteService";

export default function NewNoteForm({ bookId }: { bookId: string }) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setError(null);

    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createNote(user.uid, bookId, {
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags.length ? parsedTags : undefined,
      });

      setTitle("");
      setContent("");
      setTags("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add note section.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">New section</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Use a heading from the book (e.g. “Chapter 3 — Dependency Inversion”).
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium",
            "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20",
            "transition hover:bg-indigo-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Heading
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Key Ideas / Chapter title / Concept"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Summary
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[110px] w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Write the idea in your own words. Add examples, pitfalls, patterns…"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Tags (optional)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="clean-architecture, testing, habits"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </form>
  );
}
