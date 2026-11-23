import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ringkasan admin</h1>
        <p className="text-muted text-sm leading-6">
          Panel kurasi katalog akan tersedia pada Phase 4.
        </p>
      </header>

      <Alert>
        Tidak ada konten yang boleh dipublikasikan tanpa sumber resmi, tanggal pemeriksaan,
        reviewer, dan kanal handoff yang valid.
      </Alert>

      <Card>
        <CardTitle>Status fondasi</CardTitle>
        <CardDescription>
          Autentikasi magic link, RBAC, dan skema database sudah menjadi fondasi. CRUD layanan,
          review, publish, laporan, dan audit akan ditambahkan pada fase berikutnya.
        </CardDescription>
      </Card>
    </div>
  );
}
