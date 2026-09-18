import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { userProfileConverter } from "../lib/converters/UserProfileConverter";
import type { UserProfile } from "../types/UserProfile";

type NewUserProfileInput = Omit<UserProfile, "id" | "createdAt" | "yearlyGoals">;

const userDocRef = (userId: string) =>
  doc(db, "users", userId).withConverter(userProfileConverter);

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userDocRef(userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function createUserProfile(
  userId: string,
  input: NewUserProfileInput
): Promise<void> {
  const profile: UserProfile = {
    id: userId,
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    createdAt: new Date(),
  };

  await setDoc(userDocRef(userId), profile);
}

/**
 * Creates the profile document on first sign-in. Idempotent: existing
 * profiles are left untouched.
 */
export async function ensureUserProfile(
  userId: string,
  email: string | null
): Promise<void> {
  const existing = await getUserProfile(userId);
  if (existing) return;
  await createUserProfile(userId, { email: email ?? "" });
}

export function listenToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    userDocRef(userId),
    (snapshot) => callback(snapshot.exists() ? snapshot.data() : null),
    onError
  );
}

/** Sets (or clears, with null) the finished-books goal for one year. */
export async function setYearlyGoal(
  userId: string,
  year: number,
  goal: number | null
): Promise<void> {
  // Merge into the raw document: only the one year's goal changes, and it works
  // even if the profile document has not been created yet.
  await setDoc(
    doc(db, "users", userId),
    { yearlyGoals: { [String(year)]: goal } },
    { merge: true }
  );
}
