import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Masuk gagal",
};

export default function MasukErrorPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Tautan tidak dapat digunakan</h1>
        <p className="text-muted text-sm leading-6">
          Tautan mungkin sudah kedaluwarsa, sudah dipakai, atau tidak valid.
        </p>
      </header>

      <Alert variant="danger">
        Demi keamanan, kami tidak menampilkan detail teknis. Silakan minta tautan baru.
      </Alert>

      <Button asChild className="w-full">
        <Link href="/masuk">Minta tautan baru</Link>
      </Button>
    </div>
  );
}
