import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BookmarkIcon,
  BookOpenIcon,
  ChartBarIcon,
  HomeIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useAuth } from "../../lib/auth/useAuth";
import BrandMark from "./BrandMark";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const LINKS: { to: string; label: string; icon: Icon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/library", label: "Library", icon: BookOpenIcon },
  { to: "/wishlist", label: "Wishlist", icon: BookmarkIcon },
  { to: "/knowledge", label: "Knowledge", icon: LightBulbIcon },
  { to: "/stats", label: "Stats", icon: ChartBarIcon },
  { to: "/explore", label: "Explore", icon: SparklesIcon },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-medium transition",
    isActive
      ? "bg-brand-soft text-brand-ink"
      : "text-ink-muted hover:bg-sunken hover:text-ink",
  ].join(" ");

// Same states as the inline links, sized as full-width rows for the burger menu.
const menuLinkClass = (state: { isActive: boolean }) => `${navLinkClass(state)} h-11 w-full gap-3 text-base`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Escape closes the burger menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <nav aria-label="Main">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-control">
            <BrandMark />
            <span className="font-serif text-lg font-semibold tracking-tight text-ink">BookTrackr</span>
          </Link>

          {/* Inline links from lg up, where they fit; below that the burger menu takes over. */}
          <div className="hidden flex-1 items-center gap-1 lg:flex">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={handleSearch} role="search" className="relative hidden xl:block">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-subtle"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search knowledge…"
                aria-label="Search notes, insights and action items"
                className="h-9 w-48 rounded-control border border-line bg-surface pr-3 pl-8 text-sm text-ink transition placeholder:text-ink-subtle focus:border-brand focus:ring-3 focus:ring-brand/15 focus:outline-none"
              />
            </form>
            <button
              type="button"
              onClick={handleLogout}
              title={user?.email ? `Signed in as ${user.email}` : undefined}
              className="btn btn-ghost"
            >
              <ArrowRightStartOnRectangleIcon aria-hidden="true" className="size-4" />
              Logout
            </button>
            {logoutError && (
              <span role="alert" className="text-xs text-danger-ink">
                Logout failed
              </span>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="main-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="btn btn-icon btn-secondary lg:hidden"
            >
              {menuOpen ? (
                <XMarkIcon aria-hidden="true" className="size-5" />
              ) : (
                <Bars3Icon aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="main-menu" className="animate-menu-in border-t border-line bg-canvas lg:hidden">
            <ul className="mx-auto grid w-full max-w-6xl gap-1 px-4 py-3 sm:grid-cols-2 sm:px-6">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
