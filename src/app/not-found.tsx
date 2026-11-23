import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-5 py-10 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-muted text-sm leading-6">
        Halaman yang Anda cari tidak tersedia atau bukan milik akun Anda.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
