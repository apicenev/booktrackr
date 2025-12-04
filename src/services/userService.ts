import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { UserProfile } from "../types/UserProfile";

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const createUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  try {
    await setDoc(doc(db, "users", userId), profile);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};