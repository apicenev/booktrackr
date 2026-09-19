import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/firebase", () => ({ auth: { __auth: true }, db: { __db: true } }));

type Listener = (user: { uid: string; email: string } | null) => void;

// Mirrors the Firebase Auth SDK contract that matters here: listeners are
// notified only when the uid changes, and sign-in notifies them *before* its
// promise resolves (see Auth._updateCurrentUser / notifyAuthListeners).
const fakeAuth = vi.hoisted(() => {
  const state = { listener: null as Listener | null, lastUid: undefined as string | null | undefined };
  const emit = (user: { uid: string; email: string } | null) => {
    const uid = user?.uid ?? null;
    if (uid === state.lastUid) return;
    state.lastUid = uid;
    state.listener?.(user);
  };
  return {
    state,
    emit,
    onAuthStateChanged: vi.fn((_auth: unknown, cb: Listener) => {
      state.listener = cb;
      return () => {
        state.listener = null;
      };
    }),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: fakeAuth.onAuthStateChanged,
  signInWithEmailAndPassword: fakeAuth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: fakeAuth.createUserWithEmailAndPassword,
  signOut: fakeAuth.signOut,
}));

const userService = vi.hoisted(() => ({ ensureUserProfile: vi.fn() }));
vi.mock("../../services/userService", () => userService);

import { AuthProvider } from "../../lib/auth/AuthProvider";
import ProtectedRoute from "../../router/ProtectedRoute";
import PublicOnlyRoute from "../../router/PublicOnlyRoute";
import LoginPage from "../../pages/LoginPage";

const USER = { uid: "u1", email: "reader@example.com" };

function renderApp(initialPath: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><h1>Dashboard page</h1></ProtectedRoute>} />
          <Route path="/books/:id" element={<ProtectedRoute><h1>Book page</h1></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  // Firebase resolves the persisted session (none) asynchronously on startup.
  act(() => fakeAuth.emit(null));
}

async function submitLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), USER.email);
  await user.type(screen.getByLabelText("Password"), "correct-password");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

describe("login flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeAuth.state.listener = null;
    fakeAuth.state.lastUid = undefined;
    // Default: a Firestore round trip that never finishes. Auth must not wait on it.
    userService.ensureUserProfile.mockReturnValue(new Promise(() => {}));
    fakeAuth.signInWithEmailAndPassword.mockImplementation(async () => {
      fakeAuth.emit(USER);
      return { user: USER };
    });
  });

  it("reaches the dashboard after a single login, even while the profile is still loading", async () => {
    renderApp("/login");

    await submitLogin();

    expect(await screen.findByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
    expect(fakeAuth.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(userService.ensureUserProfile).toHaveBeenCalledWith(USER.uid, USER.email);
  });

  it("redirects once auth state arrives, even if the listener fires after sign-in resolves", async () => {
    fakeAuth.signInWithEmailAndPassword.mockResolvedValue({ user: USER });
    renderApp("/login");

    await submitLogin();
    // Sign-in resolved but no auth state yet: still on the login page, not bounced around.
    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();

    act(() => fakeAuth.emit(USER));

    expect(await screen.findByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
  });

  it("returns to the protected page that was originally requested", async () => {
    renderApp("/books/42");
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();

    await submitLogin();

    expect(await screen.findByRole("heading", { name: "Book page" })).toBeInTheDocument();
  });

  it("does not block login when creating the profile fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    userService.ensureUserProfile.mockRejectedValue(new Error("permission-denied"));
    renderApp("/login");

    await submitLogin();

    expect(await screen.findByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Failed to ensure user profile", expect.any(Error));
    consoleError.mockRestore();
  });

  it("shows a friendly error for invalid credentials and lets the user retry", async () => {
    fakeAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
      new FirebaseError("auth/invalid-credential", "Firebase: Error (auth/invalid-credential).")
    );
    renderApp("/login");

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    expect(screen.queryByText(/Firebase:/)).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
  });

  it("redirects an already authenticated user away from /login", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><h1>Dashboard page</h1></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    act(() => fakeAuth.emit(USER));

    expect(await screen.findByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
  });
});
