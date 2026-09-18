import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProgressEditor from "../../components/book/ProgressEditor";
import type { Book } from "../../types/Book";

const book: Book = {
  id: "b1",
  title: "Clean Code",
  author: "Robert C. Martin",
  status: "to-read",
  tags: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("ProgressEditor", () => {
  it("saves a status change for a book without page counts", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<ProgressEditor book={book} onUpdate={onUpdate} />);

    await userEvent.selectOptions(screen.getByLabelText("Status"), "reading");
    await userEvent.click(screen.getByRole("button", { name: "Save progress" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "reading", totalPages: undefined, pagesRead: undefined })
    );
    expect(onUpdate.mock.calls[0][0].startedAt).toBeInstanceOf(Date);
  });

  it("clamps pages read to the total before saving", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<ProgressEditor book={{ ...book, status: "reading" }} onUpdate={onUpdate} />);

    await userEvent.type(screen.getByLabelText("Total pages"), "300");
    await userEvent.type(screen.getByLabelText("Pages read"), "450");
    await userEvent.click(screen.getByRole("button", { name: "Save progress" }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ totalPages: 300, pagesRead: 300 }));
  });

  it("shows an error instead of failing silently when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onUpdate = vi.fn().mockRejectedValue(new Error("offline"));
    render(<ProgressEditor book={book} onUpdate={onUpdate} />);

    await userEvent.click(screen.getByRole("button", { name: "Save progress" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save progress");
    expect(screen.getByRole("button", { name: "Save progress" })).toBeEnabled();
  });
});
