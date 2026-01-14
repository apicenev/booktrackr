import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950 backdrop-blur border-b border-slate-800">
      <div className="w-full flex items-center justify-between p-4">
        <h1 className="text-slate-200 text-xl font-bold">Nevio Apicella</h1>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-200 hover:text-sky-300">Dashboard</Link>
          <Link to="/library" className="text-slate-200 hover:text-sky-300">Library</Link>
          <Link to="/wishlist" className="text-slate-200 hover:text-sky-300">Wishlist</Link>
          <Link to="/explore" className="text-slate-200 hover:text-sky-300">Explore</Link>
          <span className="text-slate-400 text-sm">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="rounded-full bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 hover:shadow-md"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;