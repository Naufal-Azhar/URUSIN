export const metadata = {
  title: "Ketentuan",
};

export default function KetentuanPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ketentuan penggunaan</h1>
        <p className="text-muted text-sm leading-6">
          Dengan menggunakan URUSIN, Anda memahami batas layanan berikut.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Batas layanan</h2>
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm leading-6">
          <li>URUSIN adalah alat bantu persiapan, bukan penyelenggara layanan publik.</li>
          <li>Informasi dapat berubah; selalu periksa kanal resmi instansi sebelum mengajukan.</li>
          <li>URUSIN tidak menjamin penerimaan berkas, biaya, atau waktu penyelesaian.</li>
          <li>Jangan menggunakan URUSIN untuk mengirim data identitas sensitif.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Konten pihak ketiga</h2>
        <p className="text-muted text-sm leading-6">
          Tautan resmi mengarah ke situs instansi di luar URUSIN. Kebijakan privasi dan ketentuan
          situs tujuan berlaku saat Anda meninggalkan URUSIN.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Perubahan</h2>
        <p className="text-muted text-sm leading-6">
          Ketentuan dan kebijakan dapat diperbarui. Versi yang berlaku akan ditampilkan pada halaman
          ini.
        </p>
      </section>
    </article>
  );
}
