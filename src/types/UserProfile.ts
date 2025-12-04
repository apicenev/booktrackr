export interface UserProfile {
  id: string; // Firestore document ID (same as auth uid)
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}