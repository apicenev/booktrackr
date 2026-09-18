import { describe, expect, it } from "vitest";
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
} from "../../domain/stats";
import type { Book } from "../../types/Book";
import type { ReadingSession } from "../../types/ReadingSession";

const at = (month: number, dayOfMonth: number, hour = 12, year = 2026) =>
  new Date(year, month, dayOfMonth, hour);

const session = (date: Date, pagesRead: number): ReadingSession => ({
  id: `${date.getTime()}`,
  bookId: "b1",
  startedAt: date,
  pagesRead,
});

const finished = (finishedAt: Date, startedAt?: Date): Book => ({
  id: `${finishedAt.getTime()}`,
  title: "T",
  author: "A",
  status: "finished",
  createdAt: at(0, 1),
  updatedAt: finishedAt,
  startedAt,
  finishedAt,
});

describe("monthly aggregates", () => {
  it("counts finished books per month of the selected year only", () => {
    const books = [
      finished(at(0, 5)),
      finished(at(0, 20)),
      finished(at(2, 1)),
      finished(at(2, 1, 12, 2025)),
      { ...finished(at(4, 1)), status: "reading" as const }, // reopened
    ];
    const months = finishedBooksByMonth(books, 2026);
    expect(months[0]).toBe(2);
    expect(months[2]).toBe(1);
    expect(months.reduce((a, b) => a + b)).toBe(3);
  });

  it("sums logged pages per month", () => {
    const months = pagesByMonth(
      [session(at(1, 1), 20), session(at(1, 28), 30), session(at(6, 3), 5), session(at(1, 1, 12, 2025), 99)],
      2026
    );
    expect(months[1]).toBe(50);
    expect(months[6]).toBe(5);
  });
});

describe("streaks", () => {
  const today = at(2, 10, 9);

  it("counts consecutive days ending today", () => {
    const sessions = [session(at(2, 10, 8), 5), session(at(2, 9, 23), 5), session(at(2, 8), 5), session(at(2, 6), 5)];
    expect(currentStreak(sessions, today)).toBe(3);
  });

  it("keeps a streak alive when today has no reading yet", () => {
    expect(currentStreak([session(at(2, 9), 5), session(at(2, 8), 5)], today)).toBe(2);
  });

  it("is 0 when the last reading day was before yesterday", () => {
    expect(currentStreak([session(at(2, 7), 5)], today)).toBe(0);
  });

  it("finds the longest run, counting a day once however many sessions it has", () => {
    const sessions = [
      session(at(0, 1), 5),
      session(at(0, 2), 5),
      session(at(0, 2, 18), 5),
      session(at(0, 3), 5),
      session(at(0, 10), 5),
    ];
    expect(longestStreak(sessions)).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe("pace and estimates", () => {
  const today = at(2, 30);

  it("averages pages per day over the window", () => {
    const sessions = [session(at(2, 30), 30), session(at(2, 1), 60), session(at(1, 1), 1000)];
    expect(pagesPerDay(sessions, today, 30)).toBe(3);
  });

  it("projects a finish date from the remaining pages", () => {
    expect(estimateFinishDate({ pagesRead: 100, totalPages: 200 }, 10, today)).toEqual(at(3, 9, 0));
    expect(estimateFinishDate({ pagesRead: 100 }, 10, today)).toBeNull();
    expect(estimateFinishDate({ pagesRead: 100, totalPages: 200 }, 0, today)).toBeNull();
  });

  it("averages days from start to finish", () => {
    const books = [finished(at(0, 11), at(0, 1)), finished(at(0, 21), at(0, 1)), finished(at(0, 5))];
    expect(averageDaysToFinish(books, 2026)).toBe(15);
    expect(averageDaysToFinish(books, 2025)).toBeNull();
  });
});

describe("goalProgress", () => {
  const midYear = new Date(2026, 6, 10); // ~52% of the year -> 6.2 of 12 books expected

  it("compares finished books with an even pace", () => {
    expect(goalProgress(6, 12, 2026, midYear)).toMatchObject({ expected: 6, status: "on-track" });
    expect(goalProgress(8, 12, 2026, midYear).status).toBe("ahead");
    expect(goalProgress(3, 12, 2026, midYear).status).toBe("behind");
    expect(goalProgress(12, 12, 2026, midYear).status).toBe("done");
  });

  it("expects the full goal for past years", () => {
    expect(goalProgress(10, 12, 2025, midYear)).toMatchObject({ expected: 12, status: "behind" });
  });
});

describe("availableYears", () => {
  it("includes the current year and years with data, newest first", () => {
    expect(availableYears([finished(at(0, 1, 12, 2024))], [session(at(0, 1, 12, 2025), 1)], 2026)).toEqual([
      2026, 2025, 2024,
    ]);
  });
});
