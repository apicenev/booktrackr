import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "text-indigo-400 font-medium text-sm"
    : "text-slate-200 hover:text-indigo-300 text-sm";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950 backdrop-blur border-b border-slate-800">
      <nav className="w-full max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-200">BookTrackr</h1>

        <div className="flex items-center gap-4">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/library" className={navLinkClass}>
            Library
          </NavLink>

          <NavLink to="/wishlist" className={navLinkClass}>
            Wishlist
          </NavLink>

          <span className="text-xs text-slate-400">{user?.email}</span>
          <button onClick={logout} className="text-sm bg-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-500 transition">Logout</button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
