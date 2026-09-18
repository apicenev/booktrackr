import { useMemo, useState } from "react";
import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import type { ActionItem } from "../../types/ActionItem";
import { deleteActionItem, updateActionItem } from "../../services/actionItemService";

/** Only http(s) links are rendered as anchors to rule out `javascript:` URLs. */
const safeHttpUrl = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

export default function ActionItemsList({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const uid = user?.uid;

  // Live via LibraryProvider, so items created by NewActionItemForm appear immediately.
  const { detailsFor, error: loadError } = useLibrary();
  const { actionItems: items, loaded } = detailsFor(bookId);
  const [actionError, setActionError] = useState<string | null>(null);

  // open first, then done; newest first within each group
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.status === b.status) return b.createdAt.getTime() - a.createdAt.getTime();
        return a.status === "open" ? -1 : 1;
      }),
    [items]
  );

  const toggleDone = async (item: ActionItem) => {
    if (!uid) return;
    const nextStatus = item.status === "done" ? "open" : "done";
    setActionError(null);
    try {
      await updateActionItem(uid, bookId, item.id, {
        status: nextStatus,
        completedAt: nextStatus === "done" ? new Date() : undefined,
      });
    } catch (err) {
      console.error("Failed to update action item", err);
      setActionError("Could not update the action item. Please try again.");
    }
  };

  const onDelete = async (id: string) => {
    if (!uid) return;
    if (!window.confirm("Delete this action item?")) return;
    setActionError(null);
    try {
      await deleteActionItem(uid, bookId, id);
    } catch (err) {
      console.error("Failed to delete action item", err);
      setActionError("Could not delete the action item. Please try again.");
    }
  };

  if (loadError) {
    return <p role="alert" className="text-sm text-red-400">{loadError}</p>;
  }

  if (!loaded) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading actions…</p>;
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
        <p className="text-sm text-slate-400">
          No actions yet. Add one above to turn insights into output.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actionError && (
        <p role="alert" className="text-sm text-red-400">{actionError}</p>
      )}
    <ul className="space-y-2">
      {sorted.map((it) => {
        const done = it.status === "done";
        const link = safeHttpUrl(it.githubUrl);
        return (
          <li
            key={it.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4"
          >
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleDone(it)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              />
              <span
                className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-200"}`}
              >
                {it.description}
              </span>
            </label>

            <div className="flex shrink-0 items-center gap-2">
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Link
                </a>
              )}
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                aria-label={`Delete action ${it.description}`}
                className="rounded-xl bg-red-600/10 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/20 transition hover:bg-red-600/20"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
    </div>
  );
}
