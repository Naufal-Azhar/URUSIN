import { Alert } from "@/components/ui/alert";

export const metadata = {
  title: "Tentang",
};

export default function TentangPage() {
  return (
    <article className="prose-urusin max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tentang URUSIN</h1>
        <p className="text-muted text-sm leading-6">
          URUSIN membantu warga Batam mempersiapkan pengurusan administrasi publik dengan lebih
          teratur.
        </p>
      </header>

      <Alert>
        URUSIN bukan situs resmi pemerintah dan tidak memiliki kewenangan menerbitkan KTP, KK, SIM,
        atau dokumen negara lainnya.
      </Alert>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Apa yang URUSIN lakukan</h2>
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Menampilkan ringkasan prosedur yang sumbernya sudah diperiksa admin.</li>
          <li>Menyediakan checklist persyaratan dan tahapan yang dapat Anda tandai sendiri.</li>
          <li>Mengarahkan Anda ke kanal resmi instansi untuk pengajuan sebenarnya.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Apa yang tidak URUSIN lakukan</h2>
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Tidak mengajukan permohonan ke sistem pemerintah.</li>
          <li>Tidak menerbitkan atau memvalidasi dokumen resmi.</li>
          <li>Tidak meminta atau menyimpan NIK, foto dokumen, atau tanda tangan.</li>
          <li>Tidak menjamin berkas diterima atau tanggal selesai.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Progres pribadi</h2>
        <p className="text-muted text-sm leading-6">
          Semua tanda selesai di URUSIN adalah catatan pribadi Anda. Itu bukan status persetujuan
          atau verifikasi dari instansi pemerintah.
        </p>
      </section>
    </article>
  );
}
