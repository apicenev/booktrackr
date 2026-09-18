import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth/useAuth";
import type { RedirectState } from "./ProtectedRoute";

/**
 * Wraps login/signup. Navigation after a successful sign-in is driven by the
 * auth state itself, so the redirect can never run ahead of `user` being set.
 */
const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;

  if (user) {
    const from = (location.state as RedirectState | null)?.from;
    return <Navigate to={from ?? "/dashboard"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
