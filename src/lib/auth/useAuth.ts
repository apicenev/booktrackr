import { createContext, useContext } from "react";

/**
 * The authenticated identity used by the app. Derived synchronously from the
 * Firebase Auth user so route guards never have to wait on Firestore.
 */
export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
