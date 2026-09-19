import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/16/solid";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth/useAuth";
import { useLibrary } from "../lib/library/useLibrary";
import { listenToUserProfile, setYearlyGoal } from "../services/userService";
import {
  availableYears,
  averageDaysToFinish,
  currentStreak,
  estimateFinishDate,
  finishedBooksByMonth,
  goalProgress,
  longestStreak,
  pagesByMonth,
  pagesPerDay,
  type GoalStatus,
} from "../domain/stats";
import MonthlyColumnChart from "../components/stats/MonthlyColumnChart";
import ProgressBar from "../components/book/ProgressBar";
import ResetStatsPanel from "../components/stats/ResetStatsPanel";
import LoadingState from "../components/ui/LoadingState";

const panelClass = "card p-5";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const GOAL_STATUS: Record<GoalStatus, { icon: Icon; text: (n: number) => string; className: string }> = {
  done: { icon: CheckCircleIcon, text: () => "Goal reached!", className: "font-medium text-success-ink" },
  ahead: { icon: ArrowTrendingUpIcon, text: (n) => `${n} ahead of schedule`, className: "font-medium text-success-ink" },
  "on-track": { icon: ArrowRightIcon, text: () => "On track", className: "font-medium text-ink" },
  behind: { icon: ArrowTrendingDownIcon, text: (n) => `${n} behind schedule`, className: "font-medium text-warning-ink" },
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={panelClass}>
      <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}

function GoalEditor({
  current,
  onSave,
  onCancel,
}: {
  current: number | null;
  onSave: (goal: number | null) => Promise<void>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(current?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (goal: number | null) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(goal);
    } catch (err) {
      console.error("Failed to save goal", err);
      setError("Could not save the goal. Please try again.");
      setSaving(false);
    }
  };

  const parsed = Number.parseInt(value, 10);
  const valid = parsed > 0 && parsed <= 1000;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) save(parsed);
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="field">
        Books to finish
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 block h-10 w-28 rounded-control border border-control bg-surface px-3 text-sm text-ink tabular-nums transition focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
          placeholder="24"
        />
      </label>
      <button
        type="submit"
        disabled={!valid || saving}
        className="btn btn-primary h-10"
      >
        {saving ? "Saving…" : "Save goal"}
      </button>
      {current !== null && (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={saving}
          className="btn btn-ghost h-10"
        >
          Remove goal
        </button>
      )}
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn btn-ghost h-10">
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-danger-ink">
          {error}
        </p>
      )}
    </form>
  );
}

export default function StatsPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { books, sessions, booksLoaded, detailsLoaded, error } = useLibrary();

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [goals, setGoals] = useState<Record<string, number | null>>({});
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return listenToUserProfile(
      uid,
      (profile) => setGoals(profile?.yearlyGoals ?? {}),
      (err) => console.error("Failed to load reading goals", err)
    );
  }, [uid]);

  const stats = useMemo(() => {
    const finishedByMonth = finishedBooksByMonth(books, year);
    const pages = pagesByMonth(sessions, year);
    const pace = pagesPerDay(sessions, today);
    return {
      years: availableYears(books, sessions, today.getFullYear()),
      finishedByMonth,
      finished: finishedByMonth.reduce((a, b) => a + b, 0),
      pagesByMonth: pages,
      pages: pages.reduce((a, b) => a + b, 0),
      avgDays: averageDaysToFinish(books, year),
      streak: currentStreak(sessions, today),
      longest: longestStreak(sessions),
      pace,
      inProgress: books
        .filter((b) => b.status === "reading")
        .map((b) => ({ book: b, eta: estimateFinishDate(b, pace, today) })),
    };
  }, [books, sessions, year, today]);

  if (error) {
    return (
      <p role="alert" className="alert-error">
        {error}
      </p>
    );
  }
  if (!booksLoaded || !detailsLoaded) {
    return <LoadingState label="Loading your stats…" />;
  }

  const goal = goals[String(year)] ?? null;
  const progress = goal ? goalProgress(stats.finished, goal, year, today) : null;
  const GoalIcon = progress ? GOAL_STATUS[progress.status].icon : null;
  const isCurrentYear = year === today.getFullYear();

  const saveGoal = async (value: number | null) => {
    if (!uid) return;
    await setYearlyGoal(uid, year, value);
    setEditingGoal(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title">Reading stats</h1>
        <label className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          Year
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setEditingGoal(false);
            }}
            className="h-9 cursor-pointer rounded-control border border-control bg-surface px-3 text-sm text-ink transition focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
          >
            {stats.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="panel" aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="section-title text-lg">
          {year} reading goal
        </h2>
        {progress && !editingGoal ? (
          <div className="mt-4 space-y-3">
            <p className="text-ink-muted">
              <span className="text-5xl font-semibold tracking-tight text-ink tabular-nums">{progress.finished}</span>
              <span className="text-lg text-ink-muted"> / {progress.goal} books</span>
            </p>
            <ProgressBar
              percent={Math.min(100, Math.round((progress.finished / progress.goal) * 100))}
              label={`${year} reading goal progress`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className={GOAL_STATUS[progress.status].className}>
                {GoalIcon && <GoalIcon aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />}
                {GOAL_STATUS[progress.status].text(Math.abs(progress.finished - progress.expected))}
                {isCurrentYear && progress.status !== "done" && (
                  <span className="font-normal text-ink-subtle"> · {progress.expected} expected by today</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className="btn btn-sm btn-ghost"
              >
                Edit goal
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {!goal && (
              <p className="text-sm text-ink-muted">
                Set how many books you want to finish in {year}. You have finished {stats.finished} so far.
              </p>
            )}
            <GoalEditor
              current={goal}
              onSave={saveGoal}
              onCancel={editingGoal ? () => setEditingGoal(false) : undefined}
            />
          </div>
        )}
      </section>

      <section aria-label={`${year} totals`} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label={`Books finished in ${year}`} value={stats.finished.toLocaleString()} />
        <StatTile label={`Pages read in ${year}`} value={stats.pages.toLocaleString()} hint="From logged progress" />
        <StatTile
          label="Average days per book"
          value={stats.avgDays === null ? "—" : String(stats.avgDays)}
          hint="From start to finish"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyColumnChart title={`Books finished per month, ${year}`} values={stats.finishedByMonth} unit="books" />
        <MonthlyColumnChart title={`Pages read per month, ${year}`} values={stats.pagesByMonth} unit="pages" />
      </section>

      <section className="space-y-3">
        <h2 className="section-title text-lg">Reading habits</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Current streak"
            value={`${stats.streak} ${stats.streak === 1 ? "day" : "days"}`}
            hint="Consecutive days with logged pages"
          />
          <StatTile label="Longest streak" value={`${stats.longest} ${stats.longest === 1 ? "day" : "days"}`} />
          <StatTile
            label="Pace"
            value={`${stats.pace.toFixed(1)} pages/day`}
            hint="Average over the last 30 days"
          />
        </div>

        {stats.inProgress.length > 0 && (
          <ul className="card divide-y divide-line overflow-hidden">
            {stats.inProgress.map(({ book, eta }) => (
              <li key={book.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <Link to={`/books/${book.id}`} className="book-title min-w-0 truncate hover:text-brand-ink">
                  {book.title}
                </Link>
                <span className="text-xs text-ink-muted tabular-nums">
                  {!book.totalPages
                    ? "Add total pages for an estimate"
                    : eta
                      ? `${book.totalPages - (book.pagesRead ?? 0)} pages left · done around ${eta.toLocaleDateString()}`
                      : `${book.totalPages - (book.pagesRead ?? 0)} pages left · log progress for an estimate`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-ink-subtle">
          Pages, streaks and pace come from logged progress. Progress saved before reading sessions were
          introduced isn't included.
        </p>
      </section>

      {/* Past years may no longer have data after a reset. */}
      <ResetStatsPanel books={books} onReset={() => setYear(today.getFullYear())} />
    </div>
  );
}
