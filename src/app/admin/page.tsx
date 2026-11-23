import Link from "next/link";
import { BookOpenCheck, ClipboardList, FileClock, Flag, Hammer } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/modules/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
};

const stats = [
  { key: "services" as const, label: "Layanan", icon: BookOpenCheck, href: "/admin/layanan" },
  { key: "drafts" as const, label: "Draft", icon: Hammer, href: "/admin/layanan" },
  { key: "inReview" as const, label: "Menunggu review", icon: FileClock, href: "/admin/review" },
  { key: "published" as const, label: "Terbit", icon: ClipboardList, href: "/admin/layanan" },
  { key: "openReports" as const, label: "Laporan aktif", icon: Flag, href: "/admin/laporan" },
];

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan admin</h1>
        <p className="text-muted text-sm leading-6">
          Kelola katalog, review versi, tangani laporan, dan periksa jejak audit.
        </p>
      </header>

      <Alert variant="warning">
        Admin tidak memiliki akses ke case warga. Publikasi hanya boleh dilakukan setelah sumber,
        verifikasi, persyaratan, langkah, dan handoff lengkap.
      </Alert>

      <section aria-label="Statistik admin" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.key}
              href={stat.href}
              className="border-border rounded-xl border bg-white p-4 shadow-sm hover:border-teal-300"
            >
              <span className="bg-muted-background text-muted flex h-9 w-9 items-center justify-center rounded-full">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-muted mt-3 text-xs font-medium">{stat.label}</p>
              <p className="text-foreground text-2xl font-bold">{data[stat.key]}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Alur editorial</CardTitle>
          <CardDescription>
            Draft → review → publish → archive. Versi yang sudah terbit tidak dapat diedit;
            perubahan harus melalui versi baru.
          </CardDescription>
          <Link
            href="/admin/layanan"
            className="text-primary mt-3 inline-flex text-sm font-semibold hover:underline"
          >
            Kelola layanan
          </Link>
        </Card>
        <Card>
          <CardTitle>Audit</CardTitle>
          <CardDescription>
            Setiap tindakan admin dicatat sebagai AuditEvent tanpa data pribadi atau isi formulir
            sensitif.
          </CardDescription>
          <Link
            href="/admin/audit"
            className="text-primary mt-3 inline-flex text-sm font-semibold hover:underline"
          >
            Lihat audit
          </Link>
        </Card>
      </section>
    </div>
  );
}
