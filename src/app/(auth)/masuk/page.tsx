import { isSafeRelativeCallbackUrl } from "@/lib/security";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Masuk",
};

type MasukPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function MasukPage({ searchParams }: MasukPageProps) {
  const params = await searchParams;
  const callbackUrl = isSafeRelativeCallbackUrl(params.callbackUrl)
    ? params.callbackUrl
    : "/dashboard";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Masuk ke URUSIN</h1>
        <p className="text-muted text-sm leading-6">
          Gunakan email untuk menerima tautan masuk. Progres pengurusan akan tersimpan pada akun
          Anda.
        </p>
      </header>

      <div className="border-border rounded-xl border bg-white p-5 shadow-sm">
        <SignInForm callbackUrl={callbackUrl} />
      </div>

      <p className="text-muted text-xs leading-5">
        Dengan masuk, Anda memahami bahwa URUSIN adalah alat bantu persiapan mandiri dan bukan situs
        resmi pemerintah. Jangan mengirim data identitas sensitif.
      </p>
    </div>
  );
}
