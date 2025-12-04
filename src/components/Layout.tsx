import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">BookTrackr</h1>
          <ul className="flex space-x-4">
            <li><a href="/" className="hover:text-indigo-400">Home</a></li>
            <li><a href="/login" className="hover:text-indigo-400">Login</a></li>
            <li><a href="/signup" className="hover:text-indigo-400">Sign Up</a></li>
          </ul>
        </nav>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="bg-slate-900 p-4 mt-8 text-center">
        <p className="text-sm text-slate-400">&copy; 2025 BookTrackr. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;