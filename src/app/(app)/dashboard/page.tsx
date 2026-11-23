import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CaseCard } from "@/components/cases/case-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/modules/auth/guards";
import { listUserCases } from "@/modules/cases/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireUser("/dashboard");
  const roleLabel = session.user.role === "ADMIN" ? "Admin" : "Warga";
  const cases = await listUserCases(session.user.id);
  const activeCases = cases.filter((serviceCase) => serviceCase.status !== "ARCHIVED");
  const archivedCases = cases.filter((serviceCase) => serviceCase.status === "ARCHIVED");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-primary text-sm font-medium">Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Halo, {session.user.name ?? session.user.email}
          </h1>
          <p className="text-muted text-sm">Masuk sebagai {roleLabel}.</p>
        </div>
        <SignOutButton />
      </header>

      <Alert>
        Progres di URUSIN adalah catatan pribadi Anda. Itu bukan status persetujuan atau verifikasi
        dari instansi pemerintah.
      </Alert>

      <section aria-labelledby="pengurusan-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="pengurusan-heading" className="text-xl font-semibold tracking-tight">
              Pengurusan aktif
            </h2>
            <p className="text-muted mt-1 text-sm">
              Anda dapat mengelola lebih dari satu pengurusan; progresnya terpisah.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/layanan">Tambah pengurusan</Link>
          </Button>
        </div>

        {activeCases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeCases.map((serviceCase) => (
              <CaseCard key={serviceCase.id} serviceCase={serviceCase} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-start gap-3 border-dashed">
            <span className="bg-muted-background text-muted flex h-10 w-10 items-center justify-center rounded-full">
              <ClipboardList aria-hidden="true" className="h-5 w-5" />
            </span>
            <CardTitle>Belum ada pengurusan</CardTitle>
            <CardDescription>
              Mulai dengan melihat layanan yang sudah terverifikasi, lalu buat pengurusan dari
              halaman detail.
            </CardDescription>
            <Button asChild variant="outline">
              <Link href="/layanan">
                Lihat layanan
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        )}
      </section>

      {archivedCases.length > 0 ? (
        <section aria-labelledby="arsip-heading" className="space-y-4">
          <div>
            <h2 id="arsip-heading" className="text-xl font-semibold tracking-tight">
              Diarsipkan
            </h2>
            <p className="text-muted mt-1 text-sm">
              Pengurusan yang Anda arsipkan tetap dapat dibuka untuk melihat riwayat.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedCases.map((serviceCase) => (
              <CaseCard key={serviceCase.id} serviceCase={serviceCase} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Pengaturan akun</CardTitle>
          <CardDescription>Lihat email, peran, dan opsi keluar.</CardDescription>
          <Link
            href="/pengaturan"
            className="text-primary mt-3 inline-flex text-sm font-semibold hover:underline"
          >
            Buka pengaturan
          </Link>
        </Card>
        <Card>
          <CardTitle>Privasi</CardTitle>
          <CardDescription>
            URUSIN tidak menyimpan NIK, foto dokumen, atau isi surat pribadi.
          </CardDescription>
          <Link
            href="/privasi"
            className="text-primary mt-3 inline-flex text-sm font-semibold hover:underline"
          >
            Baca kebijakan privasi
          </Link>
        </Card>
      </section>
    </div>
  );
}
