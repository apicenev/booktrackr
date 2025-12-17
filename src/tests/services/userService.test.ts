import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/firebase", () => {
  return {
    db: { __db: true },
  };
});

type DocRef = {
  kind: "doc";
  path: unknown[];
  withConverter: (converter: unknown) => DocRef;
};

const makeDocRef = (path: unknown[]): DocRef => ({
  kind: "doc",
  path,
  withConverter: () => makeDocRef(path),
});

const firestoreMocks = vi.hoisted(() => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
  };
});

vi.mock("firebase/firestore", () => {
  return {
    doc: firestoreMocks.doc,
    getDoc: firestoreMocks.getDoc,
    setDoc: firestoreMocks.setDoc,
  };
});

import { createUserProfile, getUserProfile } from "../../services/userService";

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.doc.mockImplementation((...path: unknown[]) => makeDocRef(path));

    firestoreMocks.setDoc.mockResolvedValue(undefined);
  });

  describe("getUserProfile", () => {
    it("returns profile when snapshot exists", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: "u1", email: "a@b.com" }),
      });

      const profile = await getUserProfile("u1");

      expect(firestoreMocks.doc).toHaveBeenCalled();
      expect(firestoreMocks.getDoc).toHaveBeenCalledTimes(1);
      expect(profile).toEqual({ id: "u1", email: "a@b.com" });
    });

    it("returns null when snapshot does not exist", async () => {
      firestoreMocks.getDoc.mockResolvedValue({
        exists: () => false,
        data: () => ({ id: "u1", email: "a@b.com" }),
      });

      const profile = await getUserProfile("u1");

      expect(profile).toBeNull();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.getDoc.mockRejectedValue(new Error("boom"));

      await expect(getUserProfile("u1")).rejects.toThrow("boom");
    });
  });

  describe("createUserProfile", () => {
    it("creates a profile with id=userId and createdAt=now", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-05-05T00:00:00.000Z"));

      await createUserProfile("u1", {
        email: "a@b.com",
        displayName: "Alice",
        photoURL: "https://example.com/p.png",
      });

      expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);

      const [, profile] = firestoreMocks.setDoc.mock.calls[0];

      expect(profile).toMatchObject({
        id: "u1",
        email: "a@b.com",
        displayName: "Alice",
        photoURL: "https://example.com/p.png",
      });
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect((profile.createdAt as Date).toISOString()).toBe("2024-05-05T00:00:00.000Z");

      vi.useRealTimers();
    });

    it("allows optional fields to be undefined", async () => {
      await createUserProfile("u1", {
        email: "a@b.com",
        displayName: undefined,
        photoURL: undefined,
      });

      const [, profile] = firestoreMocks.setDoc.mock.calls[0];
      expect(profile.displayName).toBeUndefined();
      expect(profile.photoURL).toBeUndefined();
    });

    it("propagates firestore errors", async () => {
      firestoreMocks.setDoc.mockRejectedValue(new Error("write failed"));

      await expect(
        createUserProfile("u1", {
          email: "a@b.com",
          displayName: "Alice",
          photoURL: "x",
        })
      ).rejects.toThrow("write failed");
    });
  });
});