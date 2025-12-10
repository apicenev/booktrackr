import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { userProfileConverter } from "../lib/converters/UserProfileConverter";
import type { UserProfile } from "../types/UserProfile";

type NewUserProfileInput = Omit<UserProfile, "id" | "createdAt">;

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
