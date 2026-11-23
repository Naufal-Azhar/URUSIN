export const adminMessages = {
  service_created: "Layanan dan versi draft berhasil dibuat.",
  version_created: "Versi draft baru berhasil dibuat.",
  saved: "Perubahan berhasil disimpan.",
  item_added: "Item berhasil ditambahkan.",
  item_deleted: "Item berhasil dihapus.",
  source_added: "Sumber resmi berhasil ditautkan.",
  source_removed: "Sumber resmi berhasil dilepas.",
  handoff_added: "Kanal resmi berhasil ditambahkan.",
  handoff_deleted: "Kanal resmi berhasil dihapus.",
  verified: "Versi ditandai sudah diverifikasi.",
  submitted: "Versi dikirim untuk review.",
  rejected: "Versi dikembalikan ke draft.",
  published: "Versi berhasil dipublikasikan.",
  archived: "Versi berhasil diarsipkan.",
  report_updated: "Status laporan berhasil diperbarui.",
  invalid_input: "Input tidak valid. Periksa kembali isian Anda.",
  not_found: "Data tidak ditemukan.",
  not_editable: "Versi ini tidak dapat diubah pada status saat ini.",
  publish_incomplete:
    "Versi belum memenuhi syarat publish: sumber, verifikasi, persyaratan, langkah, dan handoff wajib lengkap.",
  publish_conflict: "Versi lain baru saja dipublikasikan. Muat ulang halaman.",
  invalid_transition: "Perubahan status tersebut tidak diizinkan.",
  duplicate: "Kode atau slug sudah digunakan.",
  db_error: "Terjadi kesalahan database. Coba lagi.",
} as const;

export type AdminMessageCode = keyof typeof adminMessages;

export function adminMessage(code?: string) {
  if (!code) return null;
  return code in adminMessages ? adminMessages[code as AdminMessageCode] : null;
}
