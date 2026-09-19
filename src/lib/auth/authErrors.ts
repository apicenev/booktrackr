import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

/** Maps Firebase Auth errors to user-facing copy without leaking internals. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError && MESSAGES[err.code]) {
    return MESSAGES[err.code];
  }
  return "Something went wrong. Please try again.";
}
