import { type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions, Timestamp } from "firebase/firestore";
import { type UserProfile } from "../../types/UserProfile";

const toDate = (value: Timestamp | Date): Date => {
  return value instanceof Timestamp ? value.toDate() : value;
};

export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(user: UserProfile) {
    return {
      email: user.email,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: Timestamp.fromDate(user.createdAt),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): UserProfile {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      email: data.email,
      displayName: data.displayName ?? undefined,
      photoURL: data.photoURL ?? undefined,
      createdAt: toDate(data.createdAt),
    };
  },
};