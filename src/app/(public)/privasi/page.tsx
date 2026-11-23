export const metadata = {
  title: "Privasi",
};

export default function PrivasiPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Privasi</h1>
        <p className="text-muted text-sm leading-6">
          Kami berusaha menyimpan data sesedikit mungkin.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data yang disimpan</h2>
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Email akun dan nama tampilan opsional.</li>
          <li>Daftar pengurusan, status checklist, dan progres langkah milik akun Anda.</li>
          <li>Laporan ketidakakuratan yang Anda kirim, tanpa kewajiban identitas.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data yang tidak diminta</h2>
        <p className="text-muted text-sm leading-6">
          URUSIN tidak meminta NIK, nomor KK, nomor SIM, foto dokumen, tanda tangan, alamat detail,
          atau isi surat pribadi. Jangan mengirim data tersebut melalui formulir laporan. Dokumen
          persiapan dibuat di browser Anda dan tidak diunggah.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Penghapusan akun</h2>
        <p className="text-muted text-sm leading-6">
          Anda dapat meminta penghapusan akun dan data pengurusan. Detail prosedur akan tersedia di
          halaman pengaturan pada fase berikutnya. Laporan kualitas layanan dapat disimpan tanpa
          identitas pelapor.
        </p>
      </section>
    </article>
  );
}
