import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/useAuth";
import type { ReactNode } from "react";

export interface RedirectState {
  from?: string;
}

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;

  if (!user) {
    const state: RedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }

  return children;
};

export default ProtectedRoute;
