# AGENTS.md — Kontrak implementasi AI Coding Agent untuk URUSIN

> Baca **PRD_URUSIN_v1.md** dan **ERD_URUSIN_v1.md** sebelum membuat atau mengubah kode. Kedua dokumen adalah sumber kebenaran lingkup dan desain data MVP. Jangan hanya merangkum: implementasikan secara bertahap sambil menjaga batasannya.

## Misi

Bangun **URUSIN**, portal web Batam yang menggabungkan pengalaman persiapan pengurusan KTP, KK dan SIM dalam satu workspace pengguna. Ia menyediakan katalog berbasis masalah, checklist, workflow manual, lembar persiapan, handoff resmi dan dashboard kurasi. Ini bukan penerbit/penyedia API administrasi pemerintah dan bukan website artikel saja.

## Aturan non-negotiable

1. Jangan bangun penerbitan/validasi resmi KTP, KK, SIM atau pengajuan pemerintah secara langsung.
2. Jangan minta atau simpan NIK, dokumen identitas, tanda tangan, nomor KK/SIM, credentials instansi, atau isi draf surat sensitif di server/log.
3. Progres adalah tindakan **mandiri** pengguna; tidak pernah klaim status instansi.
4. Jangan mengarang persyaratan, biaya, tautan resmi atau SLA. Seed kandidat tetap DRAFT sampai verifikasi manual.
5. Hanya admin yang dapat publish versi prosedur lengkap dengan sumber, reviewer, tanggal verifikasi, dan handoff.
6. Case milik user wajib diotorisasi berdasarkan `user_id`, bukan cukup login.
7. Jaga published ServiceVersion immutable; case menunjuk snapshot version lama, tampilkan notifikasi bila versi baru tersedia.
8. Tidak ada API pemerintah, government bot, credential-sharing, scraping portal login, pembayaran, marketplace, AI chatbot, upload dokumen, atau microservices tanpa persetujuan scope baru.

## Stack yang disetujui

Next.js App Router + TypeScript strict, Tailwind CSS, shadcn/ui/Radix UI, React Hook Form + Zod, PostgreSQL + Prisma, Auth.js, pdf-lib client-side, Vitest + Testing Library, Playwright, Docker, GitHub Actions. Search via PostgreSQL FTS + pg_trgm. Jangan menambah dependensi besar tanpa alasan dalam ADR.

## Zero-Cost Development Policy — wajib

- Target biaya layanan pihak ketiga **Rp0 selama development lokal**. Gunakan open-source/self-hosted dan database PostgreSQL lokal.
- Dilarang mengaktifkan billing, memasukkan kartu kredit, membeli SaaS, menggunakan paid API, atau membuat resource cloud berbayar tanpa persetujuan eksplisit owner.
- Email harus menggunakan mock/local sink pada development. Layanan produksi, domain, hosting, dan monitoring berbayar harus diajukan terpisah.
- Evaluasi lisensi, biaya tersembunyi, dan batas free-tier sebelum memilih dependency atau layanan.

## Dependency Security & CVE Patch Policy — wajib

### Sebelum memilih atau menambah tech stack

1. Pilih versi **stable yang masih didukung**, bukan otomatis versi paling baru, nightly, RC, atau major versi lama tanpa dukungan.
2. Periksa sumber resmi (security advisory vendor, GitHub Security Advisories, NVD/OSV apabila relevan), changelog, riwayat maintenance, lisensi, dan kompatibilitas.
3. Verifikasi bahwa versi yang dipilih tidak memiliki **Critical/High CVE yang diketahui dan relevan, belum ditambal atau dimitigasi**. Jangan mengklaim paket bebas CVE hanya karena `npm audit` kosong.
4. Prioritaskan dependensi dengan maintainer aktif, rilis patch keamanan, unduhan dari registry resmi, dan footprint minimum. Hindari library yang tidak perlu.
5. Simpan alasan keputusan versi dalam `docs/DEPENDENCY_SECURITY.md`: nama, versi terpilih, tanggal pemeriksaan, URL advisory, risiko, mitigasi, lisensi, dan opsi update.
6. Jangan mengubah seluruh dependency tree dengan `npm audit fix --force` atau major upgrade otomatis. Periksa perubahan, uji regresi, dan minta persetujuan jika breaking change atau risiko substansial.
7. Gunakan `package-lock.json` ter-commit dan `npm ci` untuk instalasi reproduktif; jangan abaikan lockfile. Pisahkan runtime dari dev dependencies dan cek keduanya.

### Gate audit pada setiap fase

- Jalankan `npm audit --audit-level=high` setelah penambahan dependency dan sebelum release. Periksa output lengkap serta audit transitive dependencies.
- Jalankan lint, typecheck, unit/integration tests, build, dan E2E yang relevan setelah patch.
- Gunakan scanner open-source tambahan bila perlu (contohnya OSV-Scanner/Trivy) termasuk pemindaian image Docker/base image apabila deployment memakai container; jangan menganggap npm audit mencakup OS, Docker, atau database.
- Jangan mencatat "lulus audit" bila scanner gagal, offline, advisory database tidak bisa diakses, atau pemindaian belum dijalankan. Tulis `NOT_VERIFIED` dan alasannya.
- Critical/High yang exploitable/relevan = **release blocker**. Bila patch tidak tersedia, hilangkan/ganti dependency, mitigasi secara teruji, atau minta keputusan owner; dokumentasikan residual risk.
- Moderate/Low ditriase berdasar exploitability, exposure, dan dampak pada data; jadwalkan perbaikan dan jangan otomatis diabaikan.
- Jangan mengabaikan CVE hanya karena aplikasi berjalan di localhost. Assess exposure aktual, termasuk LAN, dev server, scripts install, dan supply-chain risk.

### Secure development minimum (termasuk lokal)

- Bind dev server dan PostgreSQL ke `127.0.0.1` bila hanya perlu di laptop; jangan default `0.0.0.0` atau expose Docker ports ke publik.
- Terapkan authorization per object, Zod validation di server, safe error handling, password/session hygiene, CSRF controls yang sesuai, security headers, dan parameterized ORM queries.
- Gunakan akun database least-privilege, secrets lewat environment variables dan `.env` dalam `.gitignore`; sediakan `.env.example` tanpa secrets nyata.
- Tidak boleh memasukkan data identitas warga sungguhan ke seed, fixture, log, screenshot testing, atau layanan AI eksternal.
- Tidak menonaktifkan audit, SSL/TLS, auth, atau security lint demi menghilangkan error secara semu.
- Untuk pilot publik: tambah HTTPS, backup+restore test, monitoring, batas trafik, rate limiting, dan review privasi sebelum exposure internet.

### Laporan keamanan wajib kepada owner

Di akhir setiap fase sebutkan: paket/versi yang ditambah atau diperbarui; sumber advisory dan tanggal pemeriksaan; hasil audit (atau `NOT_VERIFIED`); CVE yang relevan dan status patch; perubahan konfigurasi security; hasil testing regresi; serta risiko residual. Jangan klaim "100% aman".

## Prioritas pengerjaan

### Phase 0 — Audit repo & rencana

1. Inspect repo sebelum modifikasi; identifikasi kode yang sudah ada dan tidak perlu dibangun ulang.
2. Buat `docs/IMPLEMENTATION_PLAN.md` berisi fase, file yang diubah, dependensi, risiko, dan acceptance tests.
3. Buat matriks traceability FR-01..FR-16 -> halaman/API/tabel/test.
4. Laporkan perbedaan PRD/ERD dan kode eksisting. Pilih perubahan terkecil, aman, incremental.

### Phase 1 — Foundation

1. Bootstrap Next.js + lint + typecheck + test setup.
2. Prisma schema dan migrasi sesuai ERD (termasuk validasi integritas progress lintas version).
3. Auth email berbasis adapter yang disetujui, role admin/citizen, guard dan object ownership.
4. Seed 8 kandidat skenario berstatus DRAFT; jangan publish content fiktif.

### Phase 2 — Katalog publik

1. Halaman kategori, search, detail, sumber, verifikasi, official handoff.
2. Search kata sehari-hari dengan sinonim, fuzzy fallback; empty state jelas.
3. Tampilan publik hanya menampilkan published version yang valid.

### Phase 3 — Workspace pengguna

1. Buat beberapa ServiceCase, progress checklist dan langkah yang terikat ke version.
2. Cegah update item dari skenario/versi lain (tampering).
3. Peringatan versi usang; arsip/hapus progres.

### Phase 4 — Admin dan laporan

1. Draft -> review -> publish -> archive transaksional.
2. Rujukan dan audit perubahan; laporan prosedur usang.
3. Pengamanan endpoint laporan dari spam; admin audit yang tidak mengandung PII sensitif.

### Phase 5 — Document preparation dan hardening

1. Export checklist/lembar persiapan non-resmi.
2. Draf surat pribadi hanya jika ada template yang sudah disetujui; form sensitif client-only dan tidak ada autosave.
3. Unit/integration/E2E, secure headers, rate limit, backup/restore test, responsive/accessibility pass.
4. Deployment Docker dengan environment terpisah; tidak mengubah setting global host/lab tanpa izin.

## Gate kualitas wajib sebelum mencentang tugas selesai

- `lint`, `typecheck`, `test`, `build` sukses; E2E untuk alur kritis.
- Dependency security gate dan Zero-Cost Development Policy terpenuhi; temuan risiko dicatat dan tidak disembunyikan.
- Negative tests: guest tidak bisa membaca case; user A tidak dapat CRUD case user B; item versi lain tidak bisa diupdate; published content tidak bisa diedit langsung; tidak bisa publish tanpa source verified.
- Tidak ada data sensitif di DB, log, URL, telemetry, atau browser persistent storage.
- Mobile usable + keyboard navigation + error/loading/empty state.
- Semua fitur P0 bisa didemonstrasikan dengan data yang sah, atau dengan jelas dilabeli dummy dalam lingkungan development saja.

## Cara bekerja dengan owner

- Sebelum fase coding, tunjukkan rencana 1 fase dan acceptance criteria-nya; jangan langsung mengimplementasikan seluruh aplikasi sekaligus.
- Saat ada ketidakpastian prosedur pemerintah, tandai `NEEDS_VERIFICATION`, jangan menebak atau otomatis mencari pengganti tidak resmi.
- Saat menemukan fitur baru di luar scope, catat sebagai backlog P2 dan minta persetujuan; jangan selipkan ke MVP.
- Pada akhir fase, laporkan perubahan file, migrasi, perintah test dan hasil, risiko, dan fase selanjutnya.
- Berikan kode yang dapat dijalankan dan migration reproducible; tidak cukup screenshot UI dengan mock data tanpa backend.

## Contoh prompt kickoff untuk agent

```text
Baca seluruh PRD_URUSIN_v1.md, ERD_URUSIN_v1.md, dan AGENTS.md terlebih dahulu.
Audit repository saat ini. Jangan menghapus kode eksisting yang berguna.
Buat docs/IMPLEMENTATION_PLAN.md dan matriks FR -> route/component -> model -> tests.
Usulkan pekerjaan Phase 0 dan Phase 1 yang paling kecil dan berurutan.
Jangan coding dulu sampai rencana dan gap requirement sudah didaftar.
Prioritaskan keamanan data, workflow versi immutable, kepemilikan case,
dan larangan klaim integrasi pemerintah. Jangan mengarang data pelayanan resmi.
```

## Contoh prompt per fase

```text
Implementasikan hanya Phase [N] dari AGENTS.md dan acceptance criteria terkait.
Gunakan PRD/ERD sebagai source of truth. Buat migrasi dan test yang relevan.
Jangan implementasikan fitur dari fase berikutnya. Sesudah selesai,
jalankan lint/typecheck/tests/build dan laporkan hasil nyata serta masalah tersisa.
```
