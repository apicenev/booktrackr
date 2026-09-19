import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type UserProfile } from "../../types/UserProfile";
import { toDate } from "../firestoreUtils";

export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(user: UserProfile) {
    return {
      email: user.email,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: user.createdAt ? Timestamp.fromDate(user.createdAt) : null,
      yearlyGoals: user.yearlyGoals ?? {},
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      email: data.email ?? "",
      displayName: data.displayName ?? undefined,
      photoURL: data.photoURL ?? undefined,
      createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
      yearlyGoals: data.yearlyGoals ?? {},
    };
  },
};
