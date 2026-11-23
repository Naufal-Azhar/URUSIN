import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Cek email",
};

export default function CekEmailPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="bg-accent text-accent-foreground flex h-12 w-12 items-center justify-center rounded-full">
        <MailCheck aria-hidden="true" className="h-6 w-6" />
      </div>
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Cek email Anda</h1>
        <p className="text-muted text-sm leading-6">
          Jika email yang Anda masukkan valid, kami telah mengirim tautan masuk. Tautan berlaku
          selama 15 menit dan hanya dapat digunakan sekali.
        </p>
      </header>

      <Alert>
        Tidak menerima email? Periksa folder spam atau kirim ulang dari halaman masuk. Kami tidak
        menampilkan apakah sebuah email terdaftar.
      </Alert>

      <Button asChild variant="outline" className="w-full">
        <Link href="/masuk">Kembali ke halaman masuk</Link>
      </Button>
    </div>
  );
}
