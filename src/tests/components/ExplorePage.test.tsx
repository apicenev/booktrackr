import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../../types/Book";
import type { ExploreBook } from "../../services/exploreService";

vi.mock("../../lib/auth/useAuth", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));

const library = vi.hoisted(() => ({ books: [] as Book[] }));
vi.mock("../../lib/library/useLibrary", () => ({ useLibrary: () => ({ books: library.books }) }));

const bookService = vi.hoisted(() => ({ createBook: vi.fn(), updateBook: vi.fn() }));
vi.mock("../../services/bookService", () => bookService);

const trending: ExploreBook[] = [
  { key: "/works/OL1W", title: "Atomic Habits", authors: ["James Clear"], coverId: 7, pages: 320 },
];
vi.mock("../../services/exploreService", () => ({
  getCachedTrending: () => ({ books: trending, fresh: true }),
  getTrendingBooks: vi.fn(),
  getCachedSearch: vi.fn(),
  searchBooks: vi.fn(),
}));

import ExplorePage from "../../pages/ExplorePage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ExplorePage />
    </MemoryRouter>
  );

describe("ExplorePage — Want to read", () => {
  beforeEach(() => {
    library.books = [];
    bookService.createBook.mockReset().mockResolvedValue("new-id");
  });

  it("creates the book with status 'wishlist' and Open Library metadata", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Want to read" }));

    expect(bookService.createBook).toHaveBeenCalledWith("u1", {
      title: "Atomic Habits",
      author: "James Clear",
      status: "wishlist",
      totalPages: 320,
      coverId: 7,
      openLibraryKey: "/works/OL1W",
    });
  });

  it("shows the book as on the wishlist once it is in the library data", () => {
    library.books = [
      {
        id: "b1",
        title: "Atomic Habits",
        author: "James Clear",
        status: "wishlist",
        openLibraryKey: "/works/OL1W",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    renderPage();

    expect(screen.getByRole("link", { name: "On your wishlist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move to library" })).toBeInTheDocument();
  });

  it("explains a permission error instead of a generic failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    bookService.createBook.mockRejectedValue(
      new FirebaseError("permission-denied", "Missing or insufficient permissions.")
    );
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Want to read" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/security rules/i);
  });
});
