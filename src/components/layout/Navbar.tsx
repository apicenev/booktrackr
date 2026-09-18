import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth/useAuth";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/library", label: "Library" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/knowledge", label: "Knowledge" },
  { to: "/stats", label: "Stats" },
  { to: "/explore", label: "Explore" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-2 py-1 text-sm transition",
    isActive ? "text-indigo-300 font-medium" : "text-slate-200 hover:text-indigo-300",
  ].join(" ");

const Navbar = () => {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Global search across notes, insights, action items and books.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/knowledge?q=${encodeURIComponent(q)}` : "/knowledge");
    setSearch("");
  };

  const handleLogout = async () => {
    setLogoutError(false);
    try {
      // ProtectedRoute redirects to /login once the auth state clears.
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
      setLogoutError(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link to="/dashboard" className="text-xl font-bold text-slate-200">
          BookTrackr
        </Link>

        <div className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="order-2 flex items-center gap-3 sm:order-3">
          <form onSubmit={handleSearch} role="search" className="hidden lg:block">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes & actions…"
              aria-label="Search notes, insights and action items"
              className="w-48 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </form>
          <span className="hidden max-w-[12rem] truncate text-xs text-slate-400 xl:inline" title={user?.email ?? undefined}>
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-sm transition hover:bg-indigo-500"
          >
            Logout
          </button>
          {logoutError && (
            <span role="alert" className="text-xs text-red-400">
              Logout failed
            </span>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
