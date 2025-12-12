import { useState } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import { createActionItem } from "../../services/actionItemService";

export default function NewActionItemForm({ bookId }: { bookId: string }) {
  const { user } = useAuth();

  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setError(null);

    try {
      await createActionItem(user.uid, bookId, {
        description: description.trim(),
        githubUrl: githubUrl.trim() ? githubUrl.trim() : undefined,
        bookId: "",
        status: "open"
      });

      setDescription("");
      setGithubUrl("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to add action item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">New action</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Concrete next step you’ll apply. Link a GitHub issue/PR if relevant.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !description.trim()}
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
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Create a reusable Firebase converter helper for all entities"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            GitHub URL (optional)
          </label>
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="https://github.com/yourname/booktrackr/pull/12"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </form>
  );
}
