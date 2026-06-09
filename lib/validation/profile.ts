import { z } from "zod";

const blockedContactPattern = /(@[a-z0-9_]{3,}|(?:\+?998|8)?\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|https?:\/\/|t\.me\/|telegram\.me\/)/i;

export const profileSchema = z.object({
  telegramId: z.coerce.number().int().positive(),
  firstName: z.string().trim().min(2).max(40),
  age: z.coerce.number().int().min(18).max(80),
  gender: z.enum(["male", "female"]),
  region: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  bio: z.string().trim().min(10).max(300).refine((value) => !blockedContactPattern.test(value), {
    message: "Bio ichida username, telefon yoki tashqi havola bo'lmasin."
  }),
  lookingForGender: z.enum(["male", "female"]),
  purpose: z.enum(["friendship", "communication", "relationship", "gaming_partner", "study_partner", "networking"]),
  interests: z.array(z.string()).min(1).max(8),
  photoPaths: z.array(z.string().min(8)).min(3, "Kamida 3 ta profil rasmi kerak.").max(9),
  ownershipConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Rasmlar o'zingizga tegishli ekanini tasdiqlang." })
  }),
  university: z.string().optional(),
  occupation: z.string().optional(),
  heightCm: z.coerce.number().int().min(120).max(230).optional()
});

export function validateProfile(input: unknown) {
  return profileSchema.safeParse(input);
}
