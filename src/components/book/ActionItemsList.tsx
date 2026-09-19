import { useMemo, useState } from "react";
import { useAuth } from "../../lib/auth/useAuth";
import { useLibrary } from "../../lib/library/useLibrary";
import { ArrowTopRightOnSquareIcon, TrashIcon } from "@heroicons/react/16/solid";
import type { ActionItem } from "../../types/ActionItem";
import { deleteActionItem, updateActionItem } from "../../services/actionItemService";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

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
    return <p role="alert" className="msg-error">{loadError}</p>;
  }

  if (!loaded) {
    return <LoadingState label="Loading actions…" compact />;
  }

  if (sorted.length === 0) {
    return (
      <EmptyState icon={CheckCircleIcon} compact>
        No actions yet. Add one above to turn insights into output.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-2">
      {actionError && (
        <p role="alert" className="msg-error">{actionError}</p>
      )}
    <ul className="space-y-2">
      {sorted.map((it) => {
        const done = it.status === "done";
        const link = safeHttpUrl(it.githubUrl);
        return (
          <li
            key={it.id}
            className="flex items-start justify-between gap-2 rounded-control border border-line bg-surface py-2 pr-1.5 pl-3"
          >
            <label className="flex min-w-0 cursor-pointer items-start gap-3 py-1">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleDone(it)}
                className="checkbox mt-0.5 accent-success"
              />
              <span
                className={`text-sm leading-snug ${done ? "text-ink-subtle line-through" : "text-ink"}`}
              >
                {it.description}
              </span>
            </label>

            <div className="flex shrink-0 items-center">
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-ghost"
                >
                  <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
                  Link
                </a>
              )}
              <button
                type="button"
                onClick={() => onDelete(it.id)}
                aria-label={`Delete action ${it.description}`}
                className="btn btn-sm btn-icon btn-ghost hover:bg-danger-soft hover:text-danger-ink"
              >
                <TrashIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
    </div>
  );
}
