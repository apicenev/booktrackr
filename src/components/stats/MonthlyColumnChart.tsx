import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const PLOT_HEIGHT = 140; // px

const format = (n: number) => n.toLocaleString();

/**
 * Single-series column chart for 12 monthly values. One hue (validated against
 * the light card surface), columns capped at 24px with a rounded data end, the
 * peak month labelled on its cap, a hover/focus readout per column, and a
 * table view so no value depends on hovering.
 */
export default function MonthlyColumnChart({
  title,
  values,
  unit,
}: {
  title: string;
  values: number[];
  /** Plural unit for readouts, e.g. "pages". */
  unit: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...values);
  const peak = max > 0 ? values.indexOf(max) : -1;

  return (
    <figure className="card p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {/* Readout for the hovered/focused column: value leads, label follows. */}
        <p className="h-5 text-sm" aria-live="polite">
          {active !== null && (
            <>
              <span className="font-semibold text-ink tabular-nums">
                {format(values[active])} {unit}
              </span>{" "}
              <span className="text-ink-muted">in {MONTH_NAMES[active]}</span>
            </>
          )}
        </p>
      </figcaption>

      {max === 0 ? (
        <p className="mt-6 text-sm text-ink-subtle">Nothing logged for this year yet.</p>
      ) : (
        <div className="mt-6" onPointerLeave={() => setActive(null)}>
          <div className="flex items-end gap-0.5 border-b border-line-strong" style={{ height: PLOT_HEIGHT }}>
            {values.map((value, i) => {
              const height = value > 0 ? Math.max(3, (value / max) * (PLOT_HEIGHT - 20)) : 0;
              return (
                <div
                  key={MONTHS[i]}
                  tabIndex={0}
                  role="img"
                  aria-label={`${MONTH_NAMES[i]}: ${format(value)} ${unit}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  // The whole month slot is the hit target, not just the painted column.
                  className="group flex h-full flex-1 cursor-default flex-col items-center justify-end outline-none"
                >
                  {i === peak && (
                    <span className="mb-1 text-xs font-medium text-ink-muted tabular-nums">{format(value)}</span>
                  )}
                  <div
                    className={[
                      "w-full max-w-6 rounded-t transition-colors",
                      active === i ? "bg-brand-hover" : "bg-brand",
                      "group-focus-visible:ring-2 group-focus-visible:ring-brand/40 group-focus-visible:ring-offset-2",
                    ].join(" ")}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex" aria-hidden="true">
            {MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center text-xs text-ink-subtle">
                {m.charAt(0)}
                <span className="hidden sm:inline">{m.slice(1)}</span>
              </span>
            ))}
          </div>

          <details className="group mt-4 text-xs text-ink-muted">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium select-none hover:text-ink [&::-webkit-details-marker]:hidden w-fit">
              <ChevronRightIcon aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-90" />
              Show as table
            </summary>
            <table className="mt-2 w-full max-w-xs">
              <thead>
                <tr className="text-left text-ink-subtle">
                  <th className="py-0.5 font-medium">Month</th>
                  <th className="py-0.5 text-right font-medium capitalize">{unit}</th>
                </tr>
              </thead>
              <tbody>
                {values.map((value, i) => (
                  <tr key={MONTHS[i]}>
                    <td className="py-0.5">{MONTH_NAMES[i]}</td>
                    <td className="py-0.5 text-right text-ink tabular-nums">{format(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </figure>
  );
}
