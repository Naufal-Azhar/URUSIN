import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border mt-16 border-t bg-white">
      <div className="text-muted mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 text-sm sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-foreground font-semibold">URUSIN</p>
          <p className="mt-2 max-w-prose leading-6">
            Alat bantu persiapan pengurusan administrasi publik untuk warga Batam. URUSIN bukan
            situs resmi pemerintah, tidak menerbitkan dokumen resmi, dan tidak mengajukan permohonan
            ke instansi.
          </p>
        </div>
        <nav
          aria-label="Tautan informasi"
          className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end"
        >
          <Link href="/tentang" className="hover:text-foreground hover:underline">
            Tentang
          </Link>
          <Link href="/privasi" className="hover:text-foreground hover:underline">
            Privasi
          </Link>
          <Link href="/ketentuan" className="hover:text-foreground hover:underline">
            Ketentuan
          </Link>
        </nav>
      </div>
    </footer>
  );
}
