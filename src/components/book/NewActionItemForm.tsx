import { useState } from "react";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useAuth } from "../../lib/auth/useAuth";
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
        githubUrl: githubUrl.trim() || undefined,
      });

      setDescription("");
      setGithubUrl("");
    } catch (err) {
      console.error("Failed to add action item", err);
      setError("Failed to add action item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="well p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">New action</h3>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Concrete next step you’ll apply. Add a link (issue, PR, doc) if relevant.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !description.trim()}
          className="btn btn-sm btn-primary"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
          {saving ? "Adding…" : "Add"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <label className="field">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="input"
            placeholder="Create a reusable Firebase converter helper for all entities"
          />
        </label>

        <label className="field">
          Link <span className="field-hint">(optional)</span>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="input"
            placeholder="https://github.com/yourname/booktrackr/pull/12"
          />
        </label>

        {error && <p role="alert" className="text-xs text-danger-ink">{error}</p>}
      </div>
    </form>
  );
}
