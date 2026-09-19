import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../../types/Book";

vi.mock("../../lib/auth/useAuth", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));
const resetStatistics = vi.hoisted(() => vi.fn());
vi.mock("../../services/statsService", () => ({ resetStatistics }));

import ResetStatsPanel from "../../components/stats/ResetStatsPanel";

const books: Book[] = [
  { id: "b1", title: "T", author: "A", status: "finished", createdAt: new Date(), updatedAt: new Date() },
];

describe("ResetStatsPanel", () => {
  beforeEach(() => {
    resetStatistics.mockReset().mockResolvedValue(undefined);
  });

  it("only resets after typing the confirmation word", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ResetStatsPanel books={books} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: "Reset statistics…" }));
    const confirm = screen.getByRole("button", { name: "Permanently reset" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/to confirm/), "reset"); // wrong case
    expect(confirm).toBeDisabled();

    await user.clear(screen.getByLabelText(/to confirm/));
    await user.type(screen.getByLabelText(/to confirm/), "RESET");
    await user.click(confirm);

    expect(resetStatistics).toHaveBeenCalledWith("u1", books);
    expect(await screen.findByRole("status")).toHaveTextContent("Statistics reset");
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled without resetting", async () => {
    const user = userEvent.setup();
    render(<ResetStatsPanel books={books} />);

    await user.click(screen.getByRole("button", { name: "Reset statistics…" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(resetStatistics).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reset statistics…" })).toBeInTheDocument();
  });

  it("keeps the panel open with an error when the reset fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetStatistics.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<ResetStatsPanel books={books} />);

    await user.click(screen.getByRole("button", { name: "Reset statistics…" }));
    await user.type(screen.getByLabelText(/to confirm/), "RESET");
    await user.click(screen.getByRole("button", { name: "Permanently reset" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That didn't work");
    expect(screen.getByRole("button", { name: "Permanently reset" })).toBeEnabled();
  });
});
