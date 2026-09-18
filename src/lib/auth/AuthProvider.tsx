import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserProfile } from "../../services/userService";
import { AuthContext, type AuthContextType, type AuthUser } from "./useAuth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // The auth state must be committed synchronously from the Firebase user.
    // Awaiting Firestore here (as before) left `user` null after sign-in
    // resolved, so the protected route bounced the user back to /login.
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null
      );
      setInitializing(false);

      if (firebaseUser) {
        // Profile bootstrapping is not required to use the app, so it must not
        // gate authentication. Failures are reported, not swallowed.
        ensureUserProfile(firebaseUser.uid, firebaseUser.email).catch((err) => {
          console.error("Failed to ensure user profile", err);
        });
      }
    });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      initializing,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signup: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      logout: () => signOut(auth),
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
