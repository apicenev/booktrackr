import { useEffect, useState, useContext, createContext, type ReactNode } from "react";
import React from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface AuthContextType {
  user: any;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            createdAt: serverTimestamp(),
          });
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userDoc.data(),
        });
      } else {
        setUser(null);
      }
      setInitializing(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    const auth = getAuth();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, initializing, login, signup, logout, loading } },
    children
  );
};