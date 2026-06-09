import { z } from "zod";

export const photoUploadSchema = z.object({
  telegramId: z.coerce.number().int().positive(),
  fileName: z.string().min(3).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.coerce.number().int().min(1).max(8 * 1024 * 1024)
});

export function validatePhotoUpload(input: unknown) {
  return photoUploadSchema.safeParse(input);
}
