import { z } from "zod";
import { isSafeRelativeCallbackUrl, normalizeEmail, normalizedEmailSchema } from "@/lib/security";

export const signInSchema = z.object({
  email: z.string().trim().min(3).max(254).transform(normalizeEmail).pipe(normalizedEmailSchema),
  callbackUrl: z
    .string()
    .max(2048)
    .optional()
    .refine((value) => value === undefined || isSafeRelativeCallbackUrl(value), {
      message: "Tujuan setelah masuk tidak valid.",
    }),
});

export type SignInInput = z.infer<typeof signInSchema>;
