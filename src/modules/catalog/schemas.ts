import { z } from "zod";

export const catalogCategorySchema = z.enum(["ktp", "kk", "sim"]);

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  kategori: z
    .union([catalogCategorySchema, z.literal("")])
    .optional()
    .default(""),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export function normalizePage(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 100);
}
