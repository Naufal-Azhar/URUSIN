export const versionStatusLabels = {
  DRAFT: "Draft",
  IN_REVIEW: "Menunggu review",
  PUBLISHED: "Terbit",
  ARCHIVED: "Diarsipkan",
} as const;

export const versionStatusStyles = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_REVIEW: "bg-amber-50 text-amber-900",
  PUBLISHED: "bg-emerald-50 text-emerald-800",
  ARCHIVED: "bg-zinc-100 text-zinc-700",
} as const;

export const reportStatusLabels = {
  OPEN: "Baru",
  REVIEWING: "Sedang ditinjau",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
} as const;

export const reportStatusStyles = {
  OPEN: "bg-amber-50 text-amber-900",
  REVIEWING: "bg-sky-50 text-sky-800",
  RESOLVED: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-zinc-100 text-zinc-700",
} as const;

export const allowedReportNextStatuses = {
  OPEN: ["REVIEWING", "RESOLVED", "REJECTED"],
  REVIEWING: ["RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: [],
} as const;

export const revisionActionLabels = {
  SUBMIT: "Kirim review",
  APPROVE: "Setujui",
  REJECT: "Kembalikan",
  PUBLISH: "Publikasikan",
  ARCHIVE: "Arsipkan",
} as const;

export const auditActionLabels = {
  SERVICE_CREATE: "Layanan dibuat",
  SERVICE_UPDATE: "Layanan diperbarui",
  VERSION_CREATE: "Versi dibuat",
  VERSION_UPDATE: "Versi diperbarui",
  VERSION_SUBMIT: "Versi dikirim review",
  VERSION_APPROVE: "Versi disetujui",
  VERSION_REJECT: "Versi dikembalikan",
  VERSION_PUBLISH: "Versi dipublikasikan",
  VERSION_ARCHIVE: "Versi diarsipkan",
  REPORT_TRIAGE: "Laporan ditriase",
  ADMIN_PROMOTE: "Admin dipromosikan",
  ACCOUNT_DELETE: "Akun dihapus",
} as const;
