import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1", email: "reader@example.com" }, logout: vi.fn() }),
}));

import Navbar from "../../components/layout/Navbar";

function renderNavbar() {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Navbar />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Navbar burger menu", () => {
  it("opens and closes the menu with the toggle button", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("main-menu")).toBeNull();

    await user.click(toggle);
    const menu = document.getElementById("main-menu")!;
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Dashboard", "Library", "Wishlist", "Knowledge", "Stats", "Explore",
    ]);

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.getElementById("main-menu")).toBeNull();
  });

  it("closes after choosing a destination and marks it as current", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(document.getElementById("main-menu")!).getByRole("link", { name: "Stats" }));

    expect(document.getElementById("main-menu")).toBeNull();
    // The inline (desktop) link reflects the new route.
    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute("aria-current", "page");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.keyboard("{Escape}");

    expect(document.getElementById("main-menu")).toBeNull();
  });
});
