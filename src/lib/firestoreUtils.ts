import { FirebaseError } from "firebase/app";
import { Timestamp } from "firebase/firestore";

export const toDate = (value: Timestamp | Date): Date =>
  value instanceof Timestamp ? value.toDate() : value;

/**
 * `updateDoc` bypasses converters and rejects `undefined` values
 * ("Unsupported field value: undefined"). Optional fields are stored as `null`
 * by the converters, so clearing a field maps `undefined` to `null` as well.
 */
export function toUpdateData<T extends object>(partial: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(partial)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => [key, value === undefined ? null : value])
  );
}

/** User-facing message for a failed Firestore write. */
export function writeErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "permission-denied") {
      return "Saving was blocked by the Firestore security rules. If the app was just updated, publish the latest firestore.rules.";
    }
    if (err.code === "unavailable") {
      return "You appear to be offline. Please try again.";
    }
  }
  return "That didn't work. Please try again.";
}
