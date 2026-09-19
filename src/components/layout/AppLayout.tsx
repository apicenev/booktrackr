import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.tsx";
import { useAuth } from "../../lib/auth/useAuth";
import { LibraryProvider } from "../../lib/library/LibraryProvider";

const AppLayout = () => {
  // Rendered inside ProtectedRoute, so a user is always present here.
  const { user } = useAuth();

  return (
    <LibraryProvider key={user!.uid} uid={user!.uid}>
      <div className="min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Outlet />
        </main>
      </div>
    </LibraryProvider>
  );
};

export default AppLayout;
