import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/hooks/useAuth";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;