import { describe, expect, it } from "vitest";
import { validateProfile } from "@/lib/validation/profile";

const baseProfile = {
  telegramId: 123456,
  firstName: "Aliya",
  age: 21,
  gender: "female",
  region: "Toshkent",
  district: "Chilonzor",
  bio: "Kitob, musiqa va foydali suhbatlarni yaxshi ko'raman.",
  lookingForGender: "male",
  purpose: "friendship",
  interests: ["Kitob", "IT"],
  photoPaths: ["pending/123/1.jpg", "pending/123/2.jpg", "pending/123/3.jpg"],
  ownershipConfirmed: true
};

describe("profile validation", () => {
  it("accepts a valid Uzbek profile payload", () => {
    const result = validateProfile(baseProfile);
    expect(result.success).toBe(true);
  });

  it("rejects Telegram usernames in bio", () => {
    const result = validateProfile({ ...baseProfile, bio: "Menga @username orqali yozing" });
    expect(result.success).toBe(false);
  });

  it("rejects users younger than 18", () => {
    const result = validateProfile({ ...baseProfile, age: 17 });
    expect(result.success).toBe(false);
  });

  it("requires at least three owned profile photos", () => {
    expect(validateProfile({ ...baseProfile, photoPaths: ["pending/123/1.jpg", "pending/123/2.jpg"] }).success).toBe(false);
    expect(validateProfile({ ...baseProfile, ownershipConfirmed: false }).success).toBe(false);
  });
});
