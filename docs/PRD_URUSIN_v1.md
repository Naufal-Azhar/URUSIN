# Product Requirements Document (PRD) — URUSIN

**Versi:** 1.0 (rancangan MVP)  
**Status:** Draft untuk implementasi, belum tervalidasi pengguna maupun instansi  
**Wilayah pilot:** Kota Batam  
**Tagline:** Urusan Publik, Jadi Lebih Gampang  
**Produk:** Portal terpadu pendamping pengurusan administrasi publik (web responsif/PWA)  
**Sumber awal:** `BMC_URUSIN.pdf` (4 halaman). Keputusan pengembangan selanjutnya berasal dari brainstorming produk, bukan klaim yang sudah divalidasi dalam BMC.

## 1. Ringkasan eksekutif

URUSIN membantu warga Batam menemukan layanan administrasi yang sesuai dengan masalahnya, menyiapkan syarat dan draf pendukung yang diperbolehkan, mengelola beberapa pengurusan dalam satu workspace, dan melanjutkan tahap pengajuan ke **kanal resmi pemerintah**. Ini **bukan** website artikel semata, tetapi juga **bukan** sistem penerbitan/pengajuan dokumen pemerintah. Tanpa API dan otorisasi pemerintah, URUSIN hanya menyatukan **pengalaman persiapan serta koordinasi**, bukan kewenangan layanan publik.

## 2. Asal kebutuhan dan keputusan scope

| Aspek | BMC asli | Keputusan produk dalam PRD ini |
|---|---|---|
| Segmen | Warga Batam; pendatang; mahasiswa/pekerja; UMKM | Pilot fokus warga umum Batam |
| Layanan contoh | KTP, KK, SIM, pajak, perizinan | MVP KTP/KK/SIM; pajak kendaraan dan NIB fase berikutnya |
| Nilai utama | Pencarian, panduan, checklist, pelacak mandiri | Tambah workspace lintas pengurusan, formulir persiapan, draf terbatas, handoff resmi |
| Verifikasi | Kurasi sumber resmi, semua masih asumsi | Mekanisme review/publish + histori revisi + bukti sumber |
| Pengingat | WA/e-mail (asumsi) | Ditunda; pengingat dalam aplikasi / email opsional fase berikutnya |
| Pendapatan | Sponsorship, premium, B2G/CSR (asumsi) | Tidak dibangun dalam MVP; validasi terlebih dahulu |

## 3. Problem statement

Alur warga terfragmentasi di situs, kantor, dan mekanisme berbeda. Mereka sulit memastikan dokumen apa yang harus disiapkan, tahapan mana yang sudah selesai, dan kanal resmi mana yang harus digunakan. Hal ini dapat menyebabkan kebingungan, persiapan berulang, dan kunjungan yang sebenarnya dapat dihindari. Besarnya masalah dan efektivitas solusi **masih hipotesis** yang harus diuji.

## 4. Tujuan, non-tujuan, dan ukuran keberhasilan

### Tujuan MVP

1. Warga dapat menemukan satu dari 6–8 skenario pengurusan melalui istilah awam/keyword dan kategori.
2. Warga dapat membuat **workspace** berisi beberapa pengurusan, menyelesaikan checklist dan tahapan secara mandiri, dan melihat next action.
3. Warga dapat menyiapkan lembar persiapan atau **draf surat pribadi yang diizinkan**; input sensitif tidak dikirim ke server.
4. Tiap skenario yang tampil ke publik mempunyai rujukan, tanggal pemeriksaan, penanggung jawab review, serta jalur pengalihan ke layanan resmi.
5. Administrator dapat memelihara katalog dan menangani laporan informasi usang.

### Bukan tujuan MVP

- Menerbitkan KTP/KK/SIM/surat negara atau memvalidasi identitas/dokumen secara resmi.
- Mengajukan, membayar, atau melacak status sebenarnya pada sistem pemerintah.
- Mengambil kredensial pemerintah, mengisi portal secara bot, scraping area login, atau membangun API pemerintah tanpa otorisasi.
- Upload atau penyimpanan NIK, foto KTP/KK/SIM, tanda tangan, surat keterangan atau dokumen sensitif pada server.
- Marketplace jasa pengurusan, sponsorship berbayar, premium, AI agent/chatbot, WA automation, aplikasi native terpisah.
- Layanan di luar Batam atau seluruh pengurusan Indonesia.

### Ukuran keberhasilan pilot (target usulan, bukan data empiris)

- 6–8 skenario aktif dengan 100% memiliki sumber resmi dan tanggal verifikasi.
- Dalam uji tugas, >=80% peserta dapat menemukan layanan dan melengkapi simulasi persiapan tanpa bantuan.
- >=70% peserta uji menyatakan alur lebih jelas dibanding metode mereka sebelumnya; kumpulkan bukti kualitatif.
- Tidak ada klaim status penerbitan yang berasal dari sistem pemerintah.
- Tidak ada upload atau persistensi dokumen identitas di backend.
- Pengujian hipotesis BMC: 30 calon pengguna; target awal 12 menyelesaikan simulasi dan bergabung waiting list. Angka tersebut kriteria internal, bukan pembuktian representatif masyarakat Batam.

## 5. Persona dan aktor

- **Warga (authenticated):** membuat/mengelola workspace dan progres; melihat katalog; mengirim laporan ketidakakuratan.
- **Pengunjung (guest):** mencari katalog, melihat prosedur terbit dan menggunakan checklist/draf sementara di browser; progres lintas perangkat memerlukan akun.
- **Admin kurasi:** menulis/memperbarui draf katalog, memeriksa sumber, menangani laporan, dan memublikasikan versi terverifikasi. Akun admin terpisah secara otorisasi.

## 6. Cakupan layanan

### MVP: delapan skenario kandidat

> **PENTING:** Delapan skenario berikut adalah **target kandidat pengembangan**, bukan klaim bahwa persyaratan resminya sudah cocok. Sebelum setiap skenario diterbitkan, verifikasi nama layanan, kelayakan daring/luring, persyaratan, biaya, formulir, dan kanal resmi pada sumber instansi yang berlaku. Bila tidak terverifikasi, jangan publish; jumlah MVP boleh dikurangi menjadi enam.

| Kode | Kategori | Skenario | Tipe pengalaman URUSIN |
|---|---|---|---|
| KTP-01 | KTP | Perekaman/penerbitan KTP-el pertama kali | Persiapan + checklist + handoff |
| KTP-02 | KTP | Penggantian KTP-el hilang | Persiapan + checklist + handoff |
| KTP-03 | KTP | Penggantian KTP-el rusak | Persiapan + checklist + handoff |
| KK-01 | KK | Penerbitan KK karena pembentukan keluarga | Persiapan + checklist + handoff |
| KK-02 | KK | Perubahan data/anggota keluarga pada KK | Persiapan + checklist + handoff |
| KK-03 | KK | Penggantian KK hilang atau rusak | Persiapan + checklist + handoff; bila alurnya berbeda pecah skenario |
| SIM-01 | SIM | Perpanjangan SIM A | Persiapan + checklist + handoff |
| SIM-02 | SIM | Perpanjangan SIM C | Persiapan + checklist + handoff |

**Fase 1.1:** pengurusan pajak kendaraan tahunan dan persiapan NIB untuk usaha perseorangan, setelah validasi; target katalog total 10–12 skenario. Ekspansi >12 skenario, daerah lain, dan pengembangan komersial tidak termasuk persetujuan MVP.

### Batas layanan

Persyaratan dan langkah berbeda menurut kondisi pemohon. Data layanan selalu memiliki versi, sumber, dan kondisi berlaku. URUSIN tidak menjamin berkas diterima, tidak menjamin tanggal selesai, dan tidak memungut biaya pemerintah. Jika suatu prosedur membutuhkan verifikasi atau surat dari instansi, arahkan warga untuk mendapatkannya dari instansi tersebut; **jangan menghasilkan tiruan**.

## 7. Functional requirements

| ID | Prioritas | Kebutuhan | Acceptance criteria |
|---|---|---|---|
| FR-01 | P0 | Katalog & pencarian berbasis masalah | Cari istilah dan sinonim: `ktp hilang` mengarah ke skenario relevan; tidak mengarang hasil ketika tidak ada |
| FR-02 | P0 | Halaman detail layanan | Tampilkan tujuan, batas layanan, syarat, langkah, sumber, tanggal verifikasi, warning dan link resmi |
| FR-03 | P0 | Workspace multi-pengurusan | Warga login bisa menambahkan >1 skenario; masing-masing punya progres terpisah |
| FR-04 | P0 | Checklist persyaratan | Simpan tanda siap/belum pada item; tidak menyimpan isi dokumen sensitif |
| FR-05 | P0 | Workflow langkah mandiri | Setiap langkah dapat ditandai belum/mulai/selesai oleh warga; label eksplisit `progres pribadi, bukan status instansi` |
| FR-06 | P0 | Handoff ke kanal resmi | Tautan aman ke situs/alamat/kanal yang diverifikasi; tidak ada klaim pengajuan lewat URUSIN |
| FR-07 | P0 | Kurasi katalog admin | Draft → review → published/archived; hanya konten published dan masih layak tampil publik |
| FR-08 | P0 | Manajemen sumber & versi | Setiap versi terbit memiliki >=1 sumber resmi, URL, tanggal diverifikasi, reviewer dan snapshot langkah/syarat |
| FR-09 | P0 | Laporan informasi usang | Pengunjung/warga melaporkan kesalahan; admin triage, resolve/reject, menyimpan jejak audit |
| FR-10 | P0 | Login dan otorisasi | Guest katalog; user workspace miliknya; admin konten; akses objek orang lain ditolak |
| FR-11 | P1 | Generator lembar persiapan/PDF | Checklist/lembar kerja dapat diunduh; draf surat pribadi hanya template yang telah dinyatakan boleh, input sensitif diproses lokal dalam browser |
| FR-12 | P1 | Rekomendasi next action | Berdasarkan langkah belum selesai dalam workspace; tidak menafsirkan status pemerintah |
| FR-13 | P1 | Riwayat / penutupan pengurusan | User bisa menandai selesai sendiri, mengarsipkan, atau menghapus workspace |
| FR-14 | P1 | Pencarian typo | Index PostgreSQL FTS + pg_trgm + sinonim yang dikurasi, tanpa LLM |
| FR-15 | P2 | Pengingat email | Hanya opt-in dan setelah mekanisme unsubscribe/retensi siap; tidak untuk MVP |
| FR-16 | P2 | Listing penyedia jasa | Sponsorship berlabel dan uji bisnis terpisah; tidak untuk MVP |

**P0 = wajib pilot, P1 = boleh setelah P0 stabil selama MVP, P2 = di luar MVP.**

## 8. Alur pengguna utama

### 8.1 Guest: mencari prosedur

1. Buka beranda → cari kata awam / pilih kategori.
2. Lihat hasil → detail skenario dengan sumber/tanggal pemeriksaan, persyaratan, serta langkah.
3. Gunakan checklist sementara tanpa login; opsi masuk untuk menyimpan progres.
4. Ikuti handoff ke kanal resmi. Jangan tampilkan tombol `Ajukan sekarang di URUSIN` bila pengajuan tidak terjadi dalam URUSIN.

### 8.2 Warga: mengelola pengurusan

1. Registrasi/login email → dashboard.
2. Tambah skenario terverifikasi ke workspace; sistem menyimpan **version_id** yang berlaku saat dibuat.
3. Tandai persiapan checklist dan langkah mandiri (tidak pernah status persetujuan instansi).
4. Unduh lembar persiapan; bila membuat surat pribadi, hasilkan di browser.
5. Klik kanal resmi untuk melanjutkan pengajuan sendiri.
6. Tandai tahapan selesai / arsip / hapus workspace.
7. Jika versi katalog diperbarui, beri peringatan bahwa persyaratan mungkin berubah; **jangan diam-diam menimpa progres versi lama**.

### 8.3 Admin: kurasi informasi

1. Buat atau revisi skenario menjadi **draft version**; lampirkan sumber resmi dan tanggal pemeriksaan.
2. Periksa persyaratan, langkah, kriteria relevansi, tautan resmi, dan template yang diizinkan.
3. Review dan publish; versi lama tetap tersedia sebagai referensi workspace yang sudah berjalan.
4. Triage laporan usang dan audit setiap perubahan.
5. Tarik versi bermasalah dan tampilkan pesan risiko pada workspace terdampak.

## 9. UX / IA / rancangan halaman

### Halaman publik

- `/` — hero pencarian berbasis masalah, kategori layanan, penjelasan bahwa URUSIN bukan situs pemerintah.
- `/layanan` — daftar dan filter kategori; status verifikasi.
- `/layanan/[slug]` — detail, syarat, tahap, sumber resmi, tanggal verifikasi, mulai persiapan.
- `/laporkan` — formulir feedback umum terkait layanan; hindari data sensitif.
- `/tentang`, `/privasi`, `/ketentuan` — identitas penyedia, batas kewenangan dan privasi.

### Halaman user

- `/masuk`, `/daftar`
- `/dashboard` — workspace, ringkasan progress, next action, peringatan versi usang.
- `/pengurusan/[id]` — checklist, langkah mandiri, link resmi, dokumen persiapan.
- `/pengaturan` — akun, permintaan hapus akun/data.

### Halaman admin

- `/admin/layanan` — CRUD katalog & versi.
- `/admin/review` — approval publishing.
- `/admin/laporan` — triage report.
- `/admin/audit` — jejak perubahan.

### Prinsip UX

Mobile-first, teks Bahasa Indonesia jelas, WCAG 2.2 AA sebagai target, loading/error/empty state eksplisit, tombol handoff ke kanal resmi ditandai, tidak ada dark pattern premium. Jelaskan kapan harus keluar dari URUSIN menuju instansi.

## 10. Aturan data dan versi

- Publikasikan **ServiceVersion immutable** setelah review; syarat dan langkah terkait version tersebut tidak boleh diedit langsung.
- **ServiceCase** mengacu ke `service_version_id` yang digunakan saat dimulai agar progres tidak berubah ketika katalog diupdate.
- Bila panduan resmi berubah, tampilkan `Panduan diperbarui` dan minta warga memilih review/migrasi manual; jangan otomatis menghapus centang mereka.
- **ChecklistProgress** hanya menyimpan boolean/timestamp per item, tidak menyimpan NIK, nama lengkap, isi surat, nomor dokumen, atau file.
- Guest progress disimpan sementara di browser bila diimplementasikan; login diperlukan untuk sinkronisasi lintas perangkat.
- Hindari audit log menyimpan body formulir sensitif, token, email dalam bentuk yang tidak diperlukan.
- Catatan pribadi tentang status instansi tidak boleh diberi istilah `disetujui`, `ditolak`, `terverifikasi`, kecuali jelas itu input warga; gunakan `belum dimulai`, `sedang disiapkan`, `selesai ditandai pengguna`, `diarsipkan`.

## 11. Non-functional requirements

| Area | Persyaratan |
|---|---|
| Security | HTTPS, role/ownership checks pada setiap resource, secure cookies, CSRF mitigation sesuai mekanisme auth, rate limiting endpoint login/laporan, Zod input validation, escaping output, anti-XSS |
| Privacy | Data minimization, hapus akun & progres, kebijakan retensi, jangan menerima file identitas, tidak logging isi formulir sensitif |
| Performance | Target awal p75 LCP <=2.5s pada kondisi pengujian terdefinisi, frontend mobile ringan, pagination katalog, indexing query |
| Availability | Backup DB terjadwal dan restore test; tampilkan status maintenance |
| Accessibility | Navigasi keyboard, kontras memadai, label dan error form yang mudah dibaca |
| Quality | TypeScript strict, lint/typecheck, unit/integration/E2E, QA mobile, audit link resmi |
| Ops | Environment config, structured logs yang aman, error monitoring, prosedur rollback & deployment |
| Compliance | Review persyaratan UU PDP/PSE yang berlaku dan ketentuan instansi; bukan pengganti nasihat hukum |

## 12. Tech stack final

- **Next.js (App Router), React, TypeScript** — frontend & route handlers backend dalam satu monolith.
- **Tailwind CSS, shadcn/ui, Radix UI, Lucide React** — UI responsif dan aksesibel.
- **React Hook Form + Zod** — input UX dan validasi berbagi schema.
- **PostgreSQL + Prisma** — relasi, transaksi, migrasi, pencarian.
- **PostgreSQL Full Text Search + pg_trgm + tabel sinonim** — service finder deterministik.
- **Auth.js** — autentikasi sesi berbasis email/provider yang disetujui; RBAC di server.
- **pdf-lib** — lembar persiapan / surat pribadi yang diizinkan, dibuat client-side jika memerlukan input sensitif.
- **Vitest + Testing Library + Playwright** — test unit, UI, E2E.
- **Docker + reverse proxy + GitHub Actions** — deployment dan pipeline.
- **Error monitoring** dengan sanitasi data.

Jangan menambah Redis, Elasticsearch, Kubernetes, Kafka, microservices, AI chatbot atau payment gateway tanpa ADR (*Architecture Decision Record*) dan bukti kebutuhan.

## 13. Rencana delivery dan definition of done

### Milestone 0 — Verifikasi domain & desain
- Audit kandidat 8 skenario terhadap kanal resmi yang berlaku.
- Rinci dokumen, syarat kondisional, langkah, kanal handoff, label biaya, tanggal verifikasi.
- Finalisasi UI flows, threat model singkat, schema dan seed data **berlabel contoh**.

### Milestone 1 — Katalog dan admin
- Implementasi schema/auth/RBAC, Service/ServiceVersion/Source, editorial workflow.
- UI katalog, search, detail; tidak publish seed data dummy sebagai prosedur valid.

### Milestone 2 — Workspace warga
- Case/workspace, progress checklist & langkah, ownership validation, version warning.

### Milestone 3 — Form persiapan, pelaporan, dan hardening
- PDF non-resmi + pembuatan lokal untuk informasi sensitif.
- Feedback loop, audit, test keamanan, backup/restore dan QA.

### Milestone 4 — Pilot dan evaluasi
- Uji end-to-end untuk tiga kategori dan skenario yang telah diverifikasi.
- Uji tugas warga serta dokumentasi kesalahan, bukti penggunaan, dan iterasi.

### Definition of Done untuk tiap fitur
- Acceptance criteria terpenuhi + tests otomatis yang relevan lulus.
- RBAC/ownership dan error/loading/empty states diuji.
- Tidak menyimpan data sensitif di backend dan log.
- Dokumentasi perubahan, migrasi DB, dan hasil review ada.
- Untuk katalog: URL sumber resmi dan verifikasi manual dicatat sebelum publish.

## 14. Risiko dan asumsi belum tervalidasi

1. Pengguna bersedia mengganti kebiasaan mencari informasi sendiri dengan URUSIN.
2. Ada nilai cukup tinggi dari workspace lintas layanan meski tanpa akses pengajuan resmi.
3. Informasi pemerintah dapat diperiksa dan diperbarui secara berkelanjutan oleh tim kurasi.
4. Model bisnis sponsorship/premium/B2G belum terbukti; pengembangan komersial di luar MVP.
5. Sebagian prosedur dapat berubah sehingga template dan workflow harus mudah dikonfigurasi, bukan hardcode satu-satunya versi di komponen UI.

## 15. Keputusan yang harus dikunci oleh owner sebelum go-live

- Verifikasi faktual daftar 6–8 skenario beserta sumber, tanggal, dan batas validitasnya.
- Putuskan identitas badan/pengelola produk, kepatuhan dan kebijakan privasi.
- Setujui template draf non-resmi mana yang boleh dirilis (default: **hanya checklist/lembar persiapan**).
- Setujui metode auth email dan layanan email yang dipakai (tanpa hardcode vendor).
- Tetapkan siapa yang berwenang publish/review dan jadwal pemeriksaan prosedur.

**Aturan agent:** PRD ini adalah *source of truth* untuk fitur/scope MVP. Jika sebuah detail belum dikunci, tulis asumsi, pilih opsi paling aman, dan jangan menambahkan fungsi pemrosesan resmi pemerintah.
