import { z } from "zod";

export const idSchema = z.string().regex(/^[0-9a-f-]{36}$/i, "ID tidak valid.");

export const caseCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug layanan tidak valid."),
});

export const stepStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "USER_MARKED_DONE"]);

export type StepStatusInput = z.infer<typeof stepStatusSchema>;
