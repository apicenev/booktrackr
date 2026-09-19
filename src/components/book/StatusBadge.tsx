import type { BookStatus } from "../../types/Book";
import { STATUS_LABEL } from "../../domain/book";

const statusClasses: Record<BookStatus, { badge: string; dot: string }> = {
  wishlist: { badge: "bg-warning-soft text-warning-ink", dot: "bg-warning" },
  "to-read": { badge: "bg-sunken text-ink-muted", dot: "bg-ink-subtle" },
  reading: { badge: "bg-brand-soft text-brand-ink", dot: "bg-brand" },
  finished: { badge: "bg-success-soft text-success-ink", dot: "bg-success" },
};

export default function StatusBadge({ status }: { status: BookStatus }) {
  const { badge, dot } = statusClasses[status];
  return (
    <span className={`badge ${badge}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
