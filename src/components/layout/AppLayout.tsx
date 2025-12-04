import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.tsx";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;