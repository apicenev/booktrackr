export default function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-[250ms] ${
          percent >= 100 ? "bg-success" : "bg-brand"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
