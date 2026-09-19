import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../../types/Book";

vi.mock("../../lib/auth/useAuth", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));
const saveProgress = vi.hoisted(() => vi.fn());
vi.mock("../../services/readingSessionService", () => ({ saveProgress }));

import QuickLog from "../../components/book/QuickLog";

const book: Book = {
  id: "b1",
  title: "Deep Work",
  author: "Cal Newport",
  status: "to-read",
  totalPages: 300,
  pagesRead: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("QuickLog", () => {
  beforeEach(() => {
    saveProgress.mockReset().mockResolvedValue(undefined);
  });

  it("logs pages with one tap and starts a to-read book", async () => {
    render(<QuickLog book={book} />);

    await userEvent.click(screen.getByRole("button", { name: "Log 10 more pages of Deep Work" }));

    expect(saveProgress).toHaveBeenCalledWith(
      "u1",
      book,
      expect.objectContaining({ pagesRead: 10, status: "reading", startedAt: expect.any(Date) })
    );
    expect(await screen.findByText("+10 pages logged")).toBeInTheDocument();
  });

  it("logs the current page, rejecting pages beyond the last one", async () => {
    render(<QuickLog book={{ ...book, status: "reading", pagesRead: 120 }} />);
    const input = screen.getByLabelText("I'm on page");

    await userEvent.type(input, "999");
    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(input).toBeInvalid(); // browser validation: max = total pages
    expect(saveProgress).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, "150");
    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(saveProgress.mock.calls[0][2]).toMatchObject({ pagesRead: 150 });
  });

  it("offers to finish a book once the last page is reached", async () => {
    render(<QuickLog book={{ ...book, status: "reading", pagesRead: 300 }} />);

    expect(screen.queryByRole("button", { name: /Log 10/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark as finished" }));

    expect(saveProgress.mock.calls[0][2]).toMatchObject({ status: "finished", finishedAt: expect.any(Date) });
    expect(await screen.findByText("Finished — congratulations!")).toBeInTheDocument();
  });

  it("shows an error when logging fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    saveProgress.mockRejectedValue(new Error("offline"));
    render(<QuickLog book={book} />);

    await userEvent.click(screen.getByRole("button", { name: "Log 5 more pages of Deep Work" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not log progress");
  });
});
