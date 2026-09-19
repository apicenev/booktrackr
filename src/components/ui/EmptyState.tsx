import type { ComponentType, ReactNode, SVGProps } from "react";

/**
 * Consistent empty state: an outline icon (24px set), the message and an
 * optional action. `compact` is for empty lists inside panels.
 */
export default function EmptyState({
  icon: Icon,
  children,
  action,
  compact = false,
  className = "",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-card border border-dashed border-line-strong text-center ${
        compact ? "px-5 py-8" : "bg-surface/60 px-6 py-14"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`grid place-items-center rounded-full bg-sunken text-ink-subtle ${
          compact ? "mb-3 size-10" : "mb-4 size-12"
        }`}
      >
        <Icon className={compact ? "size-5" : "size-6"} strokeWidth={1.5} />
      </span>
      <div className="max-w-sm text-sm leading-relaxed text-ink-muted">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
