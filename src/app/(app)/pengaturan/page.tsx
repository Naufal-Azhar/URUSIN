import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/modules/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan",
};

export default async function PengaturanPage() {
  const session = await requireUser("/pengaturan");

  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="text-muted text-sm leading-6">Kelola informasi akun dan sesi Anda.</p>
      </header>

      <Card>
        <CardTitle>Akun</CardTitle>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-foreground font-medium">Email:</dt>
            <dd className="text-muted">{session.user.email}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-foreground font-medium">Peran:</dt>
            <dd className="text-muted">
              {session.user.role === "ADMIN" ? "Admin kurasi" : "Warga"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle>Hapus akun</CardTitle>
        <CardDescription>
          Hapus akun, sesi, case, dan progres pengurusan secara permanen. Laporan kualitas konten
          dapat tetap disimpan tanpa identitas pelapor.
        </CardDescription>
        <Link
          href="/pengaturan/hapus-akun"
          className="text-danger mt-3 inline-flex text-sm font-semibold hover:underline"
        >
          Buka halaman hapus akun
        </Link>
      </Card>

      <Card>
        <CardTitle>Sesi</CardTitle>
        <CardDescription>
          Keluar akan mengakhiri sesi ini. Anda dapat masuk kembali dengan tautan email.
        </CardDescription>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </Card>

      <p className="text-muted text-sm">
        Baca{" "}
        <Link href="/privasi" className="text-primary font-semibold hover:underline">
          kebijakan privasi
        </Link>{" "}
        untuk mengetahui data yang disimpan.
      </p>
    </div>
  );
}
