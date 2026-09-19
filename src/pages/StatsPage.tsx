import { useEffect, useMemo, useState } from "react";
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

const panelClass = "rounded-2xl border border-slate-800 bg-slate-900/50 p-5";

const GOAL_STATUS: Record<GoalStatus, { icon: string; text: (n: number) => string; className: string }> = {
  done: { icon: "✓", text: () => "Goal reached!", className: "text-emerald-300" },
  ahead: { icon: "▲", text: (n) => `${n} ahead of schedule`, className: "text-emerald-300" },
  "on-track": { icon: "●", text: () => "On track", className: "text-slate-200" },
  behind: { icon: "▼", text: (n) => `${n} behind schedule`, className: "text-amber-300" },
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={panelClass}>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
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
      <label className="text-xs font-medium text-slate-400">
        Books to finish
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block w-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="24"
        />
      </label>
      <button
        type="submit"
        disabled={!valid || saving}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save goal"}
      </button>
      {current !== null && (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={saving}
          className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
        >
          Remove goal
        </button>
      )}
      {onCancel && (
        <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-slate-200">
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-red-400">
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
      <p role="alert" className="text-sm text-red-400">
        {error}
      </p>
    );
  }
  if (!booksLoaded || !detailsLoaded) {
    return <p className="text-sm text-slate-400 animate-pulse">Loading your stats…</p>;
  }

  const goal = goals[String(year)] ?? null;
  const progress = goal ? goalProgress(stats.finished, goal, year, today) : null;
  const isCurrentYear = year === today.getFullYear();

  const saveGoal = async (value: number | null) => {
    if (!uid) return;
    await setYearlyGoal(uid, year, value);
    setEditingGoal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Reading stats</h1>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Year
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setEditingGoal(false);
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {stats.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className={panelClass} aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="text-lg font-semibold text-slate-100">
          {year} reading goal
        </h2>
        {progress && !editingGoal ? (
          <div className="mt-3 space-y-3">
            <p className="text-slate-300">
              <span className="text-4xl font-semibold text-slate-100">{progress.finished}</span>
              <span className="text-lg text-slate-400"> / {progress.goal} books</span>
            </p>
            <ProgressBar
              percent={Math.min(100, Math.round((progress.finished / progress.goal) * 100))}
              label={`${year} reading goal progress`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className={GOAL_STATUS[progress.status].className}>
                <span aria-hidden="true">{GOAL_STATUS[progress.status].icon} </span>
                {GOAL_STATUS[progress.status].text(Math.abs(progress.finished - progress.expected))}
                {isCurrentYear && progress.status !== "done" && (
                  <span className="text-slate-500"> · {progress.expected} expected by today</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className="text-slate-400 hover:text-slate-200"
              >
                Edit goal
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {!goal && (
              <p className="text-sm text-slate-400">
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
        <h2 className="text-lg font-semibold text-slate-100">Reading habits</h2>
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
          <ul className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
            {stats.inProgress.map(({ book, eta }) => (
              <li key={book.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <Link to={`/books/${book.id}`} className="min-w-0 truncate text-slate-200 hover:text-indigo-300">
                  {book.title}
                </Link>
                <span className="text-xs text-slate-400">
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

        <p className="text-xs text-slate-500">
          Pages, streaks and pace come from logged progress. Progress saved before reading sessions were
          introduced isn't included.
        </p>
      </section>

      {/* Past years may no longer have data after a reset. */}
      <ResetStatsPanel books={books} onReset={() => setYear(today.getFullYear())} />
    </div>
  );
}
