import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Alert } from "@/components/ui/alert";
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

      <Alert variant="warning">
        Fitur penghapusan akun akan tersedia pada fase hardening. Sementara itu, hubungi pengelola
        melalui kanal yang akan diumumkan sebelum pilot publik.
      </Alert>

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
