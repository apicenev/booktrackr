import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import type { ActionItem } from "../../types/ActionItem";
import {
  deleteActionItem,
  getActionItems,
  updateActionItem,
} from "../../services/actionItemService";

export default function ActionItemsList({ bookId }: { bookId: string }) {
  const { user } = useAuth();

  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const all = await getActionItems(user.uid, bookId);

    // open first, then done
    all.sort((a, b) => {
      if (a.status === b.status) return b.createdAt.getTime() - a.createdAt.getTime();
      return a.status === "open" ? -1 : 1;
    });

    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.uid) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, bookId]);

  const empty = useMemo(() => items.length === 0 && !loading, [items.length, loading]);

  const toggleDone = async (item: ActionItem) => {
    if (!user?.uid) return;
    const nextStatus = item.status === "done" ? "open" : "done";

    await updateActionItem(user.uid, bookId, item.id, {
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date() : undefined,
    });

    await refresh();
  };

  const onDelete = async (id: string) => {
    if (!user?.uid) return;
    const ok = window.confirm("Delete this action item?");
    if (!ok) return;
    await deleteActionItem(user.uid, bookId, id);
    await refresh();
  };

  if (loading) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading actions…</p>;
  }

  if (empty) {
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
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => toggleDone(it)}
                className="group flex items-start gap-3 text-left"
              >
                <span
                  className={[
                    "mt-0.5 h-5 w-5 shrink-0 rounded-md border",
                    it.status === "done"
                      ? "border-emerald-500/40 bg-emerald-500/20"
                      : "border-slate-700 bg-slate-900/40",
                  ].join(" ")}
                />
                <div className="min-w-0">
                  <p
                    className={[
                      "text-sm text-slate-200",
                      it.status === "done" ? "line-through text-slate-400" : "",
                    ].join(" ")}
                  >
                    {it.description}
                  </p>
                  {it.githubUrl ? (
                    <p className="mt-1 text-xs text-slate-500 truncate">
                      {it.githubUrl}
                    </p>
                  ) : null}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDelete(it.id)}
              className="rounded-xl bg-red-600/10 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/20 transition hover:bg-red-600/20"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
