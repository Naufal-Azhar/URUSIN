"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", event: "ui.error", digest: error.digest }));
  }, [error.digest]);

  return (
    <div className="mx-auto max-w-md space-y-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Terjadi kesalahan</h1>
      <Alert variant="danger">
        Permintaan tidak dapat diselesaikan. Kami tidak menampilkan detail teknis demi keamanan.
        Silakan coba lagi.
      </Alert>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
