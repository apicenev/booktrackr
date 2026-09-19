/** Small spinner; decorative, the label carries the meaning. */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Loading indicator for pages (centered) and panels (compact, inline). */
export default function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <p
      role="status"
      className={`flex items-center gap-2 text-sm text-ink-subtle ${
        compact ? "" : "justify-center py-16"
      }`}
    >
      <Spinner />
      {label}
    </p>
  );
}
