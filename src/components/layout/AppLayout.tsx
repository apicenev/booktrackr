import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.tsx";
import { useAuth } from "../../lib/auth/useAuth";
import { LibraryProvider } from "../../lib/library/LibraryProvider";

const AppLayout = () => {
  // Rendered inside ProtectedRoute, so a user is always present here.
  const { user } = useAuth();

  return (
    <LibraryProvider key={user!.uid} uid={user!.uid}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="max-w-5xl mx-auto py-6 px-4">
          <Outlet />
        </main>
      </div>
    </LibraryProvider>
  );
};

export default AppLayout;
