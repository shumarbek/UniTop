import { describe, expect, it } from "vitest";
import { validatePhotoUpload } from "@/lib/validation/photo";

describe("photo upload validation", () => {
  it("accepts supported image uploads", () => {
    const result = validatePhotoUpload({
      telegramId: 123,
      fileName: "face.jpg",
      contentType: "image/jpeg",
      size: 500_000
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported files and oversized uploads", () => {
    expect(validatePhotoUpload({ telegramId: 123, fileName: "file.pdf", contentType: "application/pdf", size: 10 }).success).toBe(false);
    expect(validatePhotoUpload({ telegramId: 123, fileName: "big.jpg", contentType: "image/jpeg", size: 20_000_000 }).success).toBe(false);
  });
});
