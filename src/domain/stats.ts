import type { Book } from "../types/Book";
import type { ReadingSession } from "../types/ReadingSession";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar day, so a session at 23:30 counts for the day it happened. */
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

export function finishedBooksByMonth(books: Book[], year: number): number[] {
  const months = Array<number>(12).fill(0);
  for (const b of books) {
    if (b.status === "finished" && b.finishedAt?.getFullYear() === year) {
      months[b.finishedAt.getMonth()] += 1;
    }
  }
  return months;
}

export function pagesByMonth(sessions: ReadingSession[], year: number): number[] {
  const months = Array<number>(12).fill(0);
  for (const s of sessions) {
    if (s.startedAt.getFullYear() === year) months[s.startedAt.getMonth()] += s.pagesRead ?? 0;
  }
  return months;
}

const readingDays = (sessions: ReadingSession[]) =>
  new Set(sessions.filter((s) => (s.pagesRead ?? 0) > 0).map((s) => dayKey(s.startedAt)));

/**
 * Consecutive days with logged pages, ending today. A streak that ended
 * yesterday is still alive (today isn't over yet).
 */
export function currentStreak(sessions: ReadingSession[], today: Date): number {
  const days = readingDays(sessions);
  let day = days.has(dayKey(today)) ? startOfDay(today) : addDays(today, -1);
  let streak = 0;
  while (days.has(dayKey(day))) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function longestStreak(sessions: ReadingSession[]): number {
  const days = [...readingDays(sessions)]
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    // Round: DST shifts make some local days 23 or 25 hours long.
    run = i > 0 && Math.round((days[i] - days[i - 1]) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Average pages per day over the last `windowDays` days (today included). */
export function pagesPerDay(sessions: ReadingSession[], today: Date, windowDays = 30): number {
  const from = addDays(today, -(windowDays - 1)).getTime();
  const to = addDays(today, 1).getTime();
  const pages = sessions
    .filter((s) => s.startedAt.getTime() >= from && s.startedAt.getTime() < to)
    .reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);
  return pages / windowDays;
}

/** Projected finish date at the given pace, or null when it can't be estimated. */
export function estimateFinishDate(
  book: Pick<Book, "pagesRead" | "totalPages">,
  pace: number,
  today: Date
): Date | null {
  if (!book.totalPages || pace <= 0) return null;
  const remaining = book.totalPages - (book.pagesRead ?? 0);
  if (remaining <= 0) return startOfDay(today);
  return addDays(today, Math.ceil(remaining / pace));
}

export type GoalStatus = "ahead" | "on-track" | "behind" | "done";

export interface GoalProgress {
  finished: number;
  goal: number;
  /** Books that should be finished by now to hit the goal at an even pace. */
  expected: number;
  status: GoalStatus;
}

export function goalProgress(finished: number, goal: number, year: number, today: Date): GoalProgress {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const elapsed = Math.min(1, Math.max(0, (today.getTime() - start) / (end - start)));
  const expected = Math.floor(goal * elapsed);

  let status: GoalStatus;
  if (finished >= goal) status = "done";
  else if (finished > expected) status = "ahead";
  else if (finished === expected) status = "on-track";
  else status = "behind";

  return { finished, goal, expected, status };
}

/** Average days between starting and finishing, for books finished in the year. */
export function averageDaysToFinish(books: Book[], year: number): number | null {
  const durations = books
    .filter((b) => b.status === "finished" && b.startedAt && b.finishedAt?.getFullYear() === year)
    .map((b) => Math.max(1, Math.round((b.finishedAt!.getTime() - b.startedAt!.getTime()) / DAY_MS)));
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

/** Years that have any reading data, plus the current year; newest first. */
export function availableYears(books: Book[], sessions: ReadingSession[], currentYear: number): number[] {
  const years = new Set([currentYear]);
  for (const b of books) if (b.finishedAt) years.add(b.finishedAt.getFullYear());
  for (const s of sessions) years.add(s.startedAt.getFullYear());
  return [...years].sort((a, b) => b - a);
}
