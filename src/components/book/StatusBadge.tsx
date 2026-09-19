import type { BookStatus } from "../../types/Book";
import { STATUS_LABEL } from "../../domain/book";

const statusClasses: Record<BookStatus, string> = {
  wishlist: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  "to-read": "bg-slate-700/60 text-slate-200 ring-slate-600/50",
  reading: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/30",
  finished: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
};

export default function StatusBadge({ status }: { status: BookStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClasses[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
