import { z } from "zod";
import { containsNikLikeSequence } from "@/lib/security";

export const reportIssueTypeSchema = z.enum([
  "OUTDATED_INFO",
  "BROKEN_LINK",
  "WRONG_REQUIREMENT",
  "OTHER",
]);

export const reportIssueTypeLabels = {
  OUTDATED_INFO: "Informasi sudah usang",
  BROKEN_LINK: "Tautan tidak berfungsi",
  WRONG_REQUIREMENT: "Persyaratan tidak sesuai",
  OTHER: "Masalah lain",
} as const;

export const reportSchema = z.object({
  serviceId: z.string().regex(/^[0-9a-f-]{36}$/i, "Pilih layanan yang ingin dilaporkan."),
  issueType: reportIssueTypeSchema,
  message: z
    .string()
    .trim()
    .min(20, "Tuliskan laporan minimal 20 karakter.")
    .max(1000, "Laporan maksimal 1000 karakter.")
    .refine((value) => !containsNikLikeSequence(value), {
      message:
        "Jangan mengirim NIK, nomor KK, atau deretan 16 digit. Hapus data tersebut dari laporan.",
    }),
});

export type ReportInput = z.infer<typeof reportSchema>;
