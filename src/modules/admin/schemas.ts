import { z } from "zod";
import { parseHttpUrl } from "@/lib/security";

export const adminIdSchema = z.string().regex(/^[0-9a-f-]{36}$/i, "ID tidak valid.");

export const serviceCreateSchema = z.object({
  categoryId: adminIdSchema,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}-[0-9]{2}$/, "Kode harus seperti KTP-01."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug tidak valid.")
    .max(80),
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(160),
});

export const versionUpdateSchema = z.object({
  summary: z.string().trim().min(20, "Ringkasan minimal 20 karakter.").max(5000),
  eligibilityNote: z.string().trim().max(2000).optional().default(""),
});

export const requirementCreateSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter.").max(160),
  guidance: z.string().trim().min(5, "Panduan minimal 5 karakter.").max(2000),
  conditionNote: z.string().trim().max(500).optional().default(""),
  isRequired: z.boolean(),
});

export const stepCreateSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter.").max(160),
  guidance: z.string().trim().min(5, "Panduan minimal 5 karakter.").max(2000),
  stepKind: z.enum(["PREPARE", "VISIT", "HANDOFF", "FOLLOWUP"]),
});

export const sourceCreateSchema = z.object({
  agencyName: z.string().trim().min(2, "Nama instansi minimal 2 karakter.").max(160),
  title: z.string().trim().min(2, "Judul sumber minimal 2 karakter.").max(200),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => parseHttpUrl(value) !== null, "URL harus http/https yang valid."),
  lastCheckedAt: z.string().trim().optional().default(""),
});

export const handoffCreateSchema = z.object({
  label: z.string().trim().min(2, "Label minimal 2 karakter.").max(160),
  officialUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => parseHttpUrl(value) !== null, "URL harus http/https yang valid."),
  channelType: z.enum(["WEB", "PHYSICAL", "OTHER"]),
  caveat: z.string().trim().max(1000).optional().default(""),
});

export const reportStatusSchema = z.enum(["OPEN", "REVIEWING", "RESOLVED", "REJECTED"]);

export type ReportStatusInput = z.infer<typeof reportStatusSchema>;
