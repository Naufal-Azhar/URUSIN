# Implementation Plan — URUSIN MVP v1.1

**Status:** Phase 0 disetujui owner; **Phase 1–4 SELESAI** (2026-11-23).  
**Tanggal audit:** 2026-11-23  
**Sumber kebenaran:** `PRD_URUSIN_v1.md`, `ERD_URUSIN_v1.md`, `AGENTS_URUSIN_v1.1.md`  
**Prinsip:** security by design, modular monolith, minimisasi data pribadi, zero-cost development, tanpa over-engineering.

**Status pelaksanaan:**

| Fase | Status | Bukti ringkas |
|---|---|---|
| Phase 1 — Fondasi | SELESAI | Auth magic link Mailpit, RBAC, schema/migrasi/seed, 30 test, build, `npm audit` 0 |
| Phase 2 — Katalog publik | SELESAI | `/layanan`, detail, search FTS/trigram, laporan guest, 18 integration test, 16 E2E |
| Phase 3 — Workspace warga | SELESAI | Dashboard multi-case, checklist/langkah, ownership/BOLA, version warning, arsip/hapus, 25 integration test, 19 E2E |
| Phase 4 — Admin, laporan, audit | SELESAI | Draft → review → publish/archive transaksional, sumber/handoff, triage laporan, audit, 31 integration test, 22 E2E |

> Dokumen ini tetap menjadi rencana dan catatan keputusan. Perubahan scope tetap memerlukan persetujuan owner; fase berikutnya belum dimulai tanpa persetujuan.

---

## 1. Ringkasan audit repository

### 1.1 Kondisi saat ini

| Item | Temuan |
|---|---|
| Isi repository | Hanya dokumen: `AGENTS_URUSIN_v1.1.md`, `docs/PRD_URUSIN_v1.md`, `docs/ERD_URUSIN_v1.md`, `.commandcode/taste/taste.md` |
| Git | Belum ada repository Git (`.git` tidak ditemukan) |
| Kode aplikasi | Tidak ada `package.json`, source code, test, migrasi, atau konfigurasi |
| Database lokal | PostgreSQL 18.6 terpasang dan **sudah berjalan di port 5432** (PID 6684, listen `0.0.0.0` dan `::`) |
| Docker | Docker CLI 29.8.2 terpasang, tetapi **Docker Desktop/daemon belum berjalan** |
| Node.js | v24.22.1 (memenuhi Prisma 7: `>=24.0`, Next 16: `>=20.9`) |
| npm | 12.0.2 |
| Port lain | 3000, 5433, 1025, 8025 bebas pada saat audit |

### 1.2 Konsekuensi operasional

1. Database development akan memakai Docker Compose pada **`127.0.0.1:5433`**, bukan 5432, agar tidak bertabrakan dengan PostgreSQL lokal.
2. Docker Desktop harus dijalankan sebelum Phase 1. Jika tidak memungkinkan, fallback ke PostgreSQL lokal harus memakai database/role terpisah dan hanya listen localhost — memerlukan persetujuan owner.
3. PostgreSQL lokal yang listen `0.0.0.0:5432` **tidak akan diubah** oleh proyek ini. Ini bukan bagian dari scope dan perubahan konfigurasi sistem host memerlukan izin owner.
4. Repository Git akan diinisialisasi pada Phase 1, bukan Phase 0. Dokumen ini tidak melakukan perubahan kode atau infrastruktur.

### 1.3 Yang tidak perlu dibangun ulang

- PRD, ERD, dan kontrak agent sudah tersedia dan dianggap source of truth.
- Tidak ada kode eksisting yang perlu dimigrasikan.
- Tidak ada data pengguna nyata yang boleh dipakai untuk seed, test, screenshot, atau log.

---

## 2. Urutan prioritas sumber

Sesuai instruksi proyek:

1. Batasan keamanan, privasi, hukum, dan kewenangan pemerintah.
2. Keputusan terbaru yang disetujui owner.
3. Kebutuhan fungsional/nonfungsional PRD.
4. Struktur data dan relasi ERD.
5. Konvensi repository.

Jika dokumen bertentangan, gap dicatat di §13 dan **tidak diselesaikan diam-diam**.

---

## 3. Batasan produk yang dijaga

URUSIN adalah pendamping persiapan dan koordinasi, **bukan** sistem resmi pemerintah.

Tidak akan dibangun dalam MVP:

- Penerbitan atau validasi resmi KTP/KK/SIM.
- Pengajuan, pembayaran, atau pelacakan status pada sistem pemerintah.
- API pemerintah, bot, scraping area login, atau penggunaan kredensial instansi.
- Upload/persistensi NIK, foto KTP/KK/SIM, tanda tangan, nomor KK/SIM, alamat detail, atau isi surat pribadi.
- Marketplace, sponsorship berbayar, premium, AI chatbot, WA automation, aplikasi native.
- Layanan di luar Kota Batam.
- Klaim bahwa progres pengguna adalah status instansi.

Label status yang diizinkan: `Belum dimulai`, `Sedang disiapkan`, `Selesai ditandai pengguna`, `Diarsipkan`. Tidak menggunakan `disetujui`, `ditolak`, atau `terverifikasi` untuk progres warga.

---

## 4. Keputusan teknis yang diusulkan

Keputusan berikut dipilih karena paling aman dan paling sedikit risikonya. Semua memerlukan persetujuan owner sebelum Phase 1.

| # | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| D-01 | Next.js 16.4.6 + React 19.3.1 + TypeScript 5.9.3 | Next 16 stabil; TS 5.9.3 adalah versi yang didukung `typescript-eslint@8.56` (`<6.0.0`) dan direkomendasikan Prisma 7 | TS 7.0.2 merusak peer lint; TS 6 belum didukung typescript-eslint |
| D-02 | Prisma 7.10.1 + `@prisma/adapter-pg` 7.10.1 + `pg` 8.23.1, generator `prisma-client` | Stabil; Rust-free; driver adapter wajib di Prisma 7 | Prisma CLI `latest` saat audit menunjuk ke **8.0.0-rc.35** — tidak boleh dipakai |
| D-03 | Auth.js v4 (`next-auth@4.24.15`) dengan **custom email provider** | Satu-satunya jalur Auth.js stabil; v5 masih beta; v4 mendukung Next 16 | v5 beta (tidak stabil); `@auth/core` 0.34.3 memiliki advisory Critical |
| D-04 | **Tidak memasang `@auth/core` dan `nodemailer`** | `@auth/core` 0.34.3 = peer opsional + advisory Critical/High; `nodemailer` 7.x/8.x terdampak banyak advisory, versi aman 10.6.1 di luar peer Auth.js | Memaksa versi di luar peer = kombinasi tidak didukung |
| D-05 | Email lokal melalui Mailpit dan custom SMTP writer dev-only | Zero-cost, tidak ada dependency email rentan; produksi gagal tertutup sampai owner memilih provider | Nodemailer 7/8 (rentan); SaaS email berbayar (belum disetujui) |
| D-06 | Satu database PostgreSQL, dua role: migrator dan runtime | Least privilege; runtime tanpa DDL | Satu role superuser untuk aplikasi (melanggar prinsip least privilege) |
| D-07 | Server Actions untuk mutasi; route handler hanya Auth.js | Mengurangi permukaan API, CSRF/origin handling bawaan Next, validasi server terpusat | REST API luas tanpa kebutuhan |
| D-08 | Search PostgreSQL FTS + `pg_trgm`, tanpa mesin eksternal | Sesuai stack dan zero-cost | Elasticsearch/Meilisearch (infrastruktur tambahan) |
| D-09 | PDF dibuat **client-side** dengan `pdf-lib`, tanpa simpan file | Input sensitif tidak pernah ke server; tidak ada tabel file | Server-side PDF/object storage (melanggar batasan) |
| D-10 | Rate limit in-memory untuk MVP single-instance | Cukup untuk lokal/pilot satu instance, tanpa Redis | Redis (infrastruktur tambahan); tanpa rate limit (melanggar NFR) |
| D-11 | Guest checklist sementara **ditunda** | ERD tidak punya case guest; localStorage berisiko untuk data persisten; PRD menyebut "bila diimplementasikan" | Implementasi localStorage sekarang (scope dan risiko tambahan) |
| D-12 | Tidak ada service worker/offline cache di MVP | Menghindari cache data pribadi yang tidak terkontrol; PWA offline tidak termasuk tujuan MVP | Service worker penuh (risiko kebocoran cache) |
| D-13 | Admin tidak dapat melihat/mengubah `ServiceCase` warga | ERD §3 poin 10; tidak ada kebutuhan dukungan tiket di MVP | Panel admin yang membaca semua case (melanggar privasi) |
| D-14 | Phase admin (4) sebelum document preparation (5) | Konten harus bisa dipublikasikan sebelum katalog berguna; mengikuti urutan AGENTS, bukan urutan master prompt | Mengikuti urutan master prompt (dokumen sebelum admin) |
| D-15 | Tidak ada error monitoring SaaS | Zero-cost; log terstruktur + audit lokal cukup untuk MVP | Sentry/Bugsnag (biaya/pihak ketiga) |

---

## 5. Arsitektur ringkas

- **Modular monolith** Next.js App Router: UI, Server Actions, dan akses database dalam satu aplikasi.
- Modul fitur: `auth`, `catalog`, `cases`, `reports`, `admin`, `documents`, `audit`.
- Tidak ada microservice, Redis, queue, object storage, atau API pemerintah.
- PostgreSQL adalah satu-satunya state persisten.
- Detail: lihat `docs/ARCHITECTURE.md`.

---

## 6. Struktur repository final

```text
URUSIN/
  AGENTS_URUSIN_v1.1.md
  README.md
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  eslint.config.mjs
  .prettierrc
  .prettierignore
  .gitignore
  .env.example
  docker-compose.yml
  docker/
    postgres/
      init/
        01-extensions.sql
        02-roles.sql
        03-privileges.sql
    app/
      Dockerfile
  prisma/
    schema.prisma
    migrations/
    seed.ts
    seed.demo.ts          # hanya untuk demo/E2E, bukan seed produksi
  prisma.config.ts
  src/
    app/
      (public)/
        page.tsx
        layanan/
          page.tsx
          [slug]/page.tsx
        laporkan/page.tsx
        tentang/page.tsx
        privasi/page.tsx
        ketentuan/page.tsx
      (auth)/
        masuk/page.tsx
        masuk/cek-email/page.tsx
        masuk/error/page.tsx
      (app)/
        dashboard/page.tsx
        pengurusan/[id]/page.tsx
        pengaturan/page.tsx
      admin/
        layout.tsx
        page.tsx
        layanan/page.tsx
        layanan/[id]/page.tsx
        layanan/[id]/versi/[versionId]/page.tsx
        review/page.tsx
        laporan/page.tsx
        audit/page.tsx
      api/auth/[...nextauth]/route.ts
      error.tsx
      not-found.tsx
      global-error.tsx
      layout.tsx
      globals.css
    modules/
      auth/
        config.ts
        adapter.ts
        email/mailpit-transport.ts
        email/provider.ts
        guards.ts
        schemas.ts
      catalog/
        queries.ts
        schemas.ts
        search.ts
      cases/
        actions.ts
        queries.ts
        schemas.ts
        transitions.ts
      reports/
        actions.ts
        queries.ts
        schemas.ts
      admin/
        actions.ts
        queries.ts
        schemas.ts
        publish.ts
      documents/
        checklist-pdf.ts
      audit/
        log.ts
    components/
      ui/                   # shadcn/ui
      layout/
      catalog/
      cases/
      forms/
    lib/
      db.ts
      env.ts
      logger.ts
      rate-limit.ts
      security.ts
      errors.ts
      utils.ts
      validation.ts
    generated/
      prisma/               # gitignored, hasil prisma generate
  tests/
    unit/
    integration/
    component/
    e2e/
    fixtures/
    setup/
  docs/
    PRD_URUSIN_v1.md
    ERD_URUSIN_v1.md
    IMPLEMENTATION_PLAN.md
    ARCHITECTURE.md
    DEPENDENCY_SECURITY.md
    TEST_STRATEGY.md
  scripts/
    promote-admin.ts
    purge-deleted.ts
    backup.sh
    restore-test.sh
```

Catatan:

- `src/generated/prisma/` **tidak di-commit**; dibuat oleh `npm run db:generate` dan sebelum `build`/`test`.
- `prisma/seed.demo.ts` hanya boleh dijalankan pada database test/demo dan tidak boleh dipakai untuk seed produksi.
- Tidak ada `src/app/api/*` selain Auth.js pada MVP.

---

## 7. Matriks versi dependency

Semua versi dipin **eksak** (tanpa `^`/`~`) di `package.json`. Lockfile wajib di-commit. Audit lengkap ada di `docs/DEPENDENCY_SECURITY.md`.

### Runtime

| Package | Versi | Catatan |
|---|---|---|
| `next` | 16.4.6 | Stable; Node >=20.9; Turbopack default |
| `react` / `react-dom` | 19.3.1 | Sesuai peer Next 16 |
| `next-auth` | 4.24.15 | Auth.js v4; dukungan Next 16 |
| `@next-auth/prisma-adapter` | 1.0.7 | Dibungkus wrapper; validasi tipe Prisma 7 di Phase 1 |
| `@prisma/client` | 7.10.1 | Generator `prisma-client`, output `src/generated/prisma` |
| `@prisma/adapter-pg` | 7.10.1 | Driver adapter wajib Prisma 7 |
| `pg` | 8.23.1 | Koneksi PostgreSQL |
| `zod` | 4.6.7 | Validasi client+server |
| `react-hook-form` | 7.92.0 | Form |
| `@hookform/resolvers` | 7.0.8 | Integrasi Zod |
| `pdf-lib` | 1.17.1 | Client-side; **maintenance risk** (rilis terakhir 2022) |
| `lucide-react` | 1.78.0 | Ikon |
| `clsx` | 2.1.1 | Utility class |
| `tailwind-merge` | 3.7.1 | Utility class |
| `class-variance-authority` | 0.7.1 | Varian komponen shadcn |
| `server-only` | 0.0.1 | Guard import server |
| `dotenv` | 18.0.10 | Dimuat oleh `prisma.config.ts` |

### Development

| Package | Versi | Catatan |
|---|---|---|
| `typescript` | 5.9.3 | Wajib `<6.0.0` untuk `typescript-eslint@8.56` |
| `@types/node` | 24.19.2 | Sesuai runtime Node 24 (bukan tipe Node 26) |
| `@types/react` / `@types/react-dom` | 19.3.0 | React 19 |
| `@types/pg` | 8.23.1 | `pg` |
| `eslint` | 9.39.5 | `eslint-plugin-react` (dependensi `eslint-config-next`) belum mendukung ESLint 10 |
| `eslint-config-next` | 16.4.6 | Flat config |
| `prettier` | 3.10.1 | Format |
| `prettier-plugin-tailwindcss` | 0.8.1 | Urutan class |
| `tailwindcss` | 4.3.5 | Tailwind v4 |
| `@tailwindcss/postcss` | 4.3.5 | Plugin PostCSS |
| `prisma` | 7.10.1 | **Pin eksak**; `latest` = RC 8 |
| `tsx` | 4.23.15 | Seed/script TS |
| `vitest` | 5.1.1 | Unit/integration |
| `@vitest/coverage-v8` | 5.1.1 | Coverage |
| `vite` | 8.3.8 | Peer Vitest + plugin React |
| `@vitejs/plugin-react` | 6.3.0 | Transform React |
| `jsdom` | 31.0.1 | Component test |
| `@testing-library/react` | 16.3.3 | Component test |
| `@testing-library/dom` | 10.4.1 | Peer RTL |
| `@testing-library/jest-dom` | 8.0.0 | Matcher |
| `@testing-library/user-event` | 14.6.13 | Interaksi |
| `@playwright/test` | 1.65.1 | E2E |
| `@axe-core/playwright` | 4.14.0 | Accessibility |
| `shadcn` (CLI) | 4.23.0 | Dipanggil via `npx`, komponen disalin ke repo |

Komponen Radix yang ditambahkan shadcn akan dipin eksak saat ditambahkan dan dicatat di `docs/DEPENDENCY_SECURITY.md`.

**Override keamanan:** `overrides.effect = "3.22.1"` untuk menambal `GHSA-7589-6fvf-x4pw` (High, ReDoS) yang masuk melalui `prisma@7.10.1 -> @prisma/config -> effect@3.20.0` dan `@hookform/resolvers`. Override diuji dengan Prisma generate/migrate/seed, seluruh test, dan build. Hapus override setelah Prisma memakai `effect >= 3.22.1`.

### Infrastruktur lokal

| Image | Pin | Catatan |
|---|---|---|
| PostgreSQL | `postgres:18.6-alpine@sha256:9ba53c7d41ea093baf5c1ba635ba5434c4f979880527d49bb7d9237d3193085b` | Port host `127.0.0.1:5433` |
| Mailpit | `axllent/mailpit:v1.34.0@sha256:23a2ef85bc50853ab3093645d1d64679afd8887e89da5e48a88940c172591a4e` | SMTP `127.0.0.1:1025`, UI/API `127.0.0.1:8025` |

---

## 8. Rencana fase dan acceptance criteria

> Setiap fase harus lulus gate sebelum fase berikutnya. Laporan akhir fase wajib berisi bukti perintah dan hasil nyata, bukan klaim.

### Phase 0 — Audit dan rencana (fase saat ini)

**Tujuan:** memahami repo, dokumen, stack, risiko, dan menyusun rencana yang dapat dieksekusi.

**Deliverable:**

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPENDENCY_SECURITY.md`
- `docs/TEST_STRATEGY.md`
- Matriks traceability FR-01..FR-16 (§9)
- Daftar gap dan keputusan owner (§13, §14)

**Acceptance criteria:**

- [ ] Owner menyetujui ruang lingkup MVP, versi dependency, dan fase.
- [ ] Semua gap PRD/ERD/AGENTS terdokumentasi.
- [ ] Tidak ada kode aplikasi, migrasi, atau perubahan sistem host.
- [ ] Risiko keamanan yang belum terselesaikan terlihat jelas.

**Testing:** tidak ada test perangkat lunak; verifikasi dokumen manual.

---

### Phase 1 — Fondasi aplikasi dan database

**Tujuan:** aplikasi kosong yang aman, dapat dijalankan, dan dapat diuji; autentikasi serta RBAC bekerja; schema sesuai ERD.

**Deliverable:**

- Inisialisasi Git, `package.json`, lockfile, `.gitignore`, `.env.example`, README.
- Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui dasar, layout publik/user/admin dengan disclaimer.
- `src/lib/env.ts`: validasi environment dengan Zod saat startup; gagal tertutup.
- `src/lib/db.ts`: Prisma Client 7 + `PrismaPg`, connection pool terbatas, `server-only`.
- `prisma/schema.prisma`: seluruh entitas ERD + model adapter Auth.js (`Account`, `Session`, `VerificationToken`).
- Migrasi SQL:
  - enum tersentralisasi;
  - FK, unique, index wajib;
  - partial unique index satu versi PUBLISHED per service;
  - ekstensi `pg_trgm`;
  - unique index `(service_id, lower(phrase))` untuk alias;
  - index GIN FTS/trigram;
  - role `urusin_migrator` dan `urusin_app` + grant least privilege.
- `prisma/seed.ts`: 3 kategori + 8 Service + 8 ServiceVersion **DRAFT** dengan ringkasan aman, tanpa syarat/langkah/sumber/handoff resmi; alias pencarian umum boleh.
- `docker-compose.yml`: PostgreSQL 5433 + Mailpit, bind `127.0.0.1`; healthcheck; volume.
- Auth.js v4:
  - custom adapter wrapper (normalisasi email lowercase, field mapping);
  - custom email provider tanpa `nodemailer`, pengiriman ke Mailpit;
  - session database, cookie HttpOnly/SameSite=Lax/Secure di produksi;
  - redirect callback hanya path relatif same-origin;
  - halaman `/masuk`, `/masuk/cek-email`, `/masuk/error`.
- RBAC dan guard server: `requireUser`, `requireAdmin`, ownership helper.
- `proxy.ts` Next 16 untuk redirect halaman terlindungi (bukan satu-satunya otorisasi).
- Structured logger tanpa PII; error mapper; rate limiter in-memory.
- Test setup Vitest (unit, component), Playwright, integration DB.
- CI skeleton: install, generate, lint, typecheck, unit, build.

**Acceptance criteria:**

- [ ] `npm ci` berhasil dari lockfile.
- [ ] `npm run db:generate`, `npm run db:migrate`, `npm run db:seed` reproducible pada database kosong.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` lulus.
- [ ] `docker compose up -d` hanya bind `127.0.0.1`; PostgreSQL 5432 host tidak tersentuh.
- [ ] Login magic link berhasil melalui Mailpit; sesi dapat logout; cookie memiliki flag benar.
- [ ] Guest tidak dapat membuka `/dashboard`; CITIZEN tidak dapat membuka `/admin`; ADMIN dapat.
- [ ] `npm ls @auth/core` kosong dan `npm ls nodemailer` kosong.
- [ ] `npm audit --audit-level=high` dijalankan; tidak ada Critical/High relevan yang belum dimitigasi.
- [ ] 8 skenario seed berstatus DRAFT dan **tidak tampil** di katalog publik.
- [ ] Tidak ada secret/PII di repo, log, URL, atau fixture.
- [ ] Unit + integration test untuk constraint, email normalization, redirect validation, dan RBAC lulus.

**Di luar fase:** halaman katalog publik, case, admin CRUD.

---

### Phase 2 — Katalog publik dan pencarian

**Tujuan:** pengunjung dapat menemukan skenario terverifikasi dan melihat prosedur yang layak tampil.

**Deliverable:**

- `/layanan` daftar + filter kategori + status verifikasi.
- `/layanan/[slug]` detail: tujuan, batas layanan, syarat, langkah, sumber resmi, tanggal verifikasi, handoff, disclaimer.
- `/` hero pencarian berbasis masalah + kategori.
- `/laporkan` form guest dasar (pilih layanan, jenis masalah, pesan) + rate limit/honeypot; triage admin di Phase 4.
- Query katalog yang **fail-closed**: hanya Service ACTIVE + ServiceVersion PUBLISHED yang valid (punya sumber, verified_at, verified_by, handoff).
- Search:
  - normalisasi input lowercase, trim, maksimal 80 karakter;
  - FTS `indonesian` + `pg_trgm`;
  - alias/sinonim dari `ServiceAlias`;
  - ranking exact code/title > alias > FTS > fuzzy;
  - pagination sederhana (20/halaman).
- Komponen empty/loading/error state; tidak ada hasil palsu.
- Semua tautan resmi divalidasi `http/https`, tanpa credentials, target `_blank` + `rel="noopener noreferrer"`, label "buka kanal resmi".

**Acceptance criteria:**

- [ ] DRAFT/ARCHIVED tidak pernah muncul di halaman publik.
- [ ] Versi PUBLISHED yang tidak lengkap disembunyikan dan dicatat sebagai error internal.
- [ ] `ktp hilang` dan typo umum (`ktp ilang`) menemukan skenario yang relevan melalui alias/fuzzy pada fixture test.
- [ ] Query pencarian memakai parameterized SQL; payload SQL injection tidak mengubah hasil/skema.
- [ ] XSS payload pada judul/ringkasan/laporan dirender sebagai teks.
- [ ] URL `javascript:`, `data:`, `file:`, dan credentials ditolak.
- [ ] Empty state jelas; tidak ada hasil karangan.
- [ ] Form laporan guest berfungsi; pesan dengan 16 digit ditolak; rate limit/honeypot teruji.
- [ ] Mobile 360px, keyboard navigation, dan axe pada halaman utama lulus.
- [ ] Test integration untuk filter published-only dan validasi handoff lulus.
- [ ] `npm run build` + `npm audit --audit-level=high` lulus.

**Catatan:** dengan seed DRAFT-only, katalog publik akan kosong sampai admin mempublikasikan konten terverifikasi. Ini disengaja. Demo/E2E memakai database test dengan fixture `TEST`/`CONTOH`, bukan data seed produksi.

---

### Phase 3 — Workspace warga

**Tujuan:** warga mengelola beberapa pengurusan dengan progres mandiri yang terikat versi.

**Deliverable:**

- `/dashboard`: daftar case milik user, ringkasan progres, next action, peringatan versi usang.
- `/pengurusan/[id]`: checklist syarat, langkah mandiri, link handoff, disclaimer progres pribadi.
- Server Actions:
  - tambah case dari service published;
  - upsert `RequirementProgress` (boolean + timestamp);
  - upsert `StepProgress` (enum status);
  - tandai `USER_MARKED_DONE`, arsipkan, hapus (soft delete).
- Validasi server:
  - case harus milik `session.user.id`;
  - requirement/step harus milik `service_version_id` case;
  - item dari versi lain ditolak;
  - published version immutable.
- Next action dihitung dari item belum selesai; tidak menafsirkan status pemerintah.
- Peringatan `Panduan diperbarui` jika ada PUBLISHED lebih baru; tidak menimpa progres.
- Label status sesuai §3.
- Halaman `/pengaturan` dasar (akun, logout; hapus akun di Phase 5).

**Acceptance criteria:**

- [ ] Satu user dapat membuat >1 case; progres terpisah.
- [ ] User A tidak dapat membaca/mengubah/menghapus case User B (respons 404, bukan bocor keberadaan).
- [ ] Guest tidak dapat mengakses case.
- [ ] Item requirement/step dari versi lain tidak dapat diubah (tampering test).
- [ ] Upsert idempotent; unique constraint bekerja.
- [ ] Peringatan versi usang muncul tanpa mengubah data lama.
- [ ] Case dapat diarsipkan/dihapus; data hilang dari UI dan query.
- [ ] Tidak ada kolom/file yang menyimpan NIK, dokumen, atau isi surat.
- [ ] Query dashboard tidak N+1; jumlah query dibatasi dan diuji.
- [ ] Test komponen untuk checklist/step/error/loading/empty state lulus.

---

### Phase 4 — Administrasi konten, pelaporan, dan audit

**Tujuan:** admin dapat mengkurasi konten, menerbitkan versi terverifikasi, menangani laporan, dan meninggalkan jejak audit.

**Deliverable:**

- `/admin` ringkasan.
- `/admin/layanan`: daftar service/versi; buat service; buat versi DRAFT.
- Editor versi: summary, eligibility note, requirement, workflow step, official source, version source, official handoff.
- Workflow transaksional:
  - DRAFT → IN_REVIEW (SUBMIT);
  - IN_REVIEW → DRAFT (REJECT) atau PUBLISHED (APPROVE + PUBLISH);
  - PUBLISHED → ARCHIVED (takedown atau publish versi baru).
- Validasi publish:
  - minimal 1 `OfficialSource` terhubung;
  - `verified_at` dan `verified_by_id` terisi;
  - minimal 1 `OfficialHandoff` valid;
  - minimal 1 requirement dan 1 workflow step (usulan aturan bisnis, lihat §13);
  - reviewer tercatat;
  - transaksi mengarsipkan versi PUBLISHED sebelumnya dan mempublikasikan kandidat;
  - partial unique index mencegah dua PUBLISHED.
- Published version immutable: perubahan konten hanya lewat versi baru; takedown hanya mengubah status + audit.
- `/admin/laporan`: triage OPEN → REVIEWING → RESOLVED/REJECTED; tanpa melihat identitas pelapor.
- `/admin/audit`: daftar AuditEvent, read-only, paginasi.
- `ContentRevision` untuk setiap aksi editorial.
- Rate limit laporan + honeypot + larangan pola NIK 16 digit.
- `scripts/promote-admin.ts` untuk promosi admin via CLI; tidak ada endpoint HTTP promosi.

**Acceptance criteria:**

- [ ] Publish tanpa sumber/verified/reviewer/handoff/requirement/step ditolak.
- [ ] Publish berhasil mengarsipkan versi lama dan hanya menyisakan satu PUBLISHED.
- [ ] Dua publish bersamaan tidak menghasilkan dua PUBLISHED (unique index + error handling).
- [ ] Published version tidak dapat diedit in-place; percobaan ditolak dan diaudit.
- [ ] Versi lama tetap dapat dibaca oleh case historis.
- [ ] Takedown memunculkan warning pada case terdampak.
- [ ] Citizen tidak dapat mengakses `/admin/*`.
- [ ] Admin tidak dapat membaca case warga.
- [ ] Laporan guest dapat dikirim; spam melebihi limit ditolak; honeypot bekerja.
- [ ] Pesan laporan yang mengandung 16 digit NIK ditolak dengan pesan jelas.
- [ ] AuditEvent/ContentRevision tidak mengandung email, token, isi formulir sensitif, atau PII.
- [ ] Test transaksi publish, immutability, role, dan audit sanitization lulus.
- [ ] `npm audit --audit-level=high` tetap bersih dari Critical/High relevan.

---

### Phase 5 — Persiapan dokumen dan hardening

**Tujuan:** pengguna dapat mengunduh lembar persiapan non-resmi; aplikasi siap untuk pilot lokal dengan kontrol keamanan lengkap.

**Deliverable:**

- Generator PDF **client-side** dengan `pdf-lib`:
  - checklist/lembar persiapan non-resmi;
  - judul layanan, nomor versi, tanggal verifikasi, sumber, syarat, langkah;
  - disclaimer "bukan dokumen resmi, bukan status instansi";
  - tanpa NIK/identitas secara default;
  - tidak ada autosave, localStorage, atau pengiriman ke server.
- Template surat pribadi **tidak** dibuat kecuali owner menyetujui template spesifik (default: tidak).
- Security hardening:
  - CSP nonce-based, HSTS produksi, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP, frame-ancestors;
  - rate limit login/laporan/mutasi;
  - body size limit 100 KB; tidak ada endpoint upload;
  - account deletion dengan re-authentication magic link; cascade data;
  - log redaction + test tidak ada PII;
  - secret scanning lokal (gitleaks/Trivy fs, gratis).
- Backup/restore:
  - script `pg_dump` + restore test ke database terpisah;
  - dokumentasi retensi.
- Accessibility/responsive pass: WCAG 2.2 AA target, keyboard, focus, kontras, zoom 200%, reduced motion.
- Dockerfile app multi-stage + `docker-compose.prod.yml` contoh; environment terpisah.
- CI lengkap: lint, typecheck, unit, integration, build, E2E, audit, OSV-Scanner, Trivy image (Phase 6 jika belum).

**Acceptance criteria:**

- [ ] PDF dihasilkan sepenuhnya di browser; Network tab tidak mengirim data formulir.
- [ ] Tidak ada data pribadi di localStorage/sessionStorage/IndexedDB.
- [ ] State form sensitif (jika ada) dibersihkan saat unmount/selesai.
- [ ] Security headers hadir dan CSP tidak memblokir fungsi inti.
- [ ] Login/laporan/mutasi memiliki rate limit yang teruji.
- [ ] Penghapusan akun menghapus sesi, case, progress; laporan menjadi pseudonim (`reporter_id NULL`).
- [ ] Backup dan restore test berhasil; data utuh.
- [ ] axe + keyboard + kontras pada halaman kritis lulus.
- [ ] Docker image berjalan; container scan tidak menemukan Critical/High yang belum dimitigasi.
- [ ] `npm audit`, OSV-Scanner, dan Trivy dijalankan; hasil nyata dilaporkan.
- [ ] Tidak ada klaim "100% aman".

---

### Phase 6 — QA menyeluruh dan kesiapan pilot

**Tujuan:** membuktikan P0 berfungsi dengan data sah/fixture berlabel, dan tidak ada release blocker.

**Deliverable:**

- E2E lengkap untuk alur kritis.
- Security test suite (authz matrix, BOLA, tampering, XSS, CSRF, open redirect, headers, rate limit, log leakage).
- Dependency/CVE re-audit final; update `docs/DEPENDENCY_SECURITY.md`.
- Performance pass pada build produksi lokal; catat lingkungan pengukuran.
- Dokumentasi operasional: runbook, backup/restore, rollback, insiden.
- Dokumentasi privasi/retensi; checklist UU PDP/PSE untuk review owner.
- Pilot checklist: konten terverifikasi, reviewer, jadwal pemeriksaan, kanal handoff.

**Acceptance criteria:**

- [ ] Semua FR P0 dapat didemonstrasikan dengan data terverifikasi atau fixture `TEST` yang jelas.
- [ ] Tidak ada Critical/High relevan yang belum dimitigasi.
- [ ] Tidak ada data sensitif di DB/log/URL/telemetry/browser storage.
- [ ] Mobile + keyboard + error/loading/empty state lulus.
- [ ] Backup/restore dan rollback terbukti.
- [ ] Owner menyetujui hasil pilot readiness.
- [ ] Risiko residual dan hal yang belum diverifikasi ditulis jujur.

---

## 9. Matriks traceability FR-01..FR-16

| FR | Prioritas | Halaman/aksi | Modul/query | Tabel utama | Test | Fase |
|---|---|---|---|---|---|---|
| FR-01 Katalog & pencarian | P0 | `/`, `/layanan`, `?q=` | `catalog/search.ts` | Service, ServiceAlias, ServiceVersion, ServiceCategory | unit search, integration published-only, E2E guest search | 2 |
| FR-02 Detail layanan | P0 | `/layanan/[slug]` | `catalog/queries.ts` | Service, ServiceVersion, Requirement, WorkflowStep, VersionSource, OfficialSource, OfficialHandoff | component, integration, E2E | 2 |
| FR-03 Workspace multi-case | P0 | `/dashboard`, tambah case | `cases/actions.ts` | ServiceCase, ServiceVersion | integration ownership, E2E | 3 |
| FR-04 Checklist syarat | P0 | `/pengurusan/[id]` | `cases/actions.ts` | RequirementProgress, Requirement | unit validation, integration tampering | 3 |
| FR-05 Workflow langkah mandiri | P0 | `/pengurusan/[id]` | `cases/actions.ts` | StepProgress, WorkflowStep | unit state, component, E2E | 3 |
| FR-06 Handoff resmi | P0 | detail + case | `catalog/queries.ts` | OfficialHandoff | unit URL validation, E2E external link | 2 |
| FR-07 Kurasi katalog admin | P0 | `/admin/layanan`, `/admin/review` | `admin/actions.ts` | Service, ServiceVersion, ContentRevision | integration workflow, E2E | 4 |
| FR-08 Sumber & versi | P0 | editor versi, publish | `admin/publish.ts` | OfficialSource, VersionSource, ServiceVersion, ContentRevision, AuditEvent | integration publish validation/immutability | 4 |
| FR-09 Laporan usang | P0 | `/laporkan`, `/admin/laporan` | `reports/actions.ts` | ContentReport, AuditEvent | integration rate limit, E2E | 2 (form), 4 (triage) |
| FR-10 Login & otorisasi | P0 | `/masuk`, guards | `auth/*` | User, Account, Session, VerificationToken | integration RBAC/BOLA, E2E | 1 |
| FR-11 Generator PDF | P1 | aksi unduh di case | `documents/checklist-pdf.ts` | tidak ada tabel file | unit PDF, E2E no network | 5 |
| FR-12 Next action | P1 | `/dashboard`, case | `cases/queries.ts` | ServiceCase, progress | unit, component | 3 |
| FR-13 Riwayat/penutupan | P1 | case actions | `cases/actions.ts` | ServiceCase | integration transitions, E2E | 3 |
| FR-14 Pencarian typo | P1 | `/layanan?q=` | `catalog/search.ts` | pg_trgm index, ServiceAlias | integration typo | 2 |
| FR-15 Pengingat email | P2 | — | — | — | — | di luar MVP |
| FR-16 Listing penyedia | P2 | — | — | — | — | di luar MVP |

**P0** wajib untuk pilot; **P1** setelah P0 stabil; **P2** di luar MVP dan tidak boleh diselipkan.

---

## 10. Catatan implementasi data dan invariant

### 10.1 Constraint yang wajib dibuat di migrasi SQL

Prisma schema tidak dapat mengekspresikan seluruh invariant. Migrasi SQL eksplisit wajib menambahkan:

```sql
-- Satu versi PUBLISHED aktif per service
CREATE UNIQUE INDEX service_version_one_published
  ON "ServiceVersion" ("service_id")
  WHERE status = 'PUBLISHED';

-- Alias unik setelah normalisasi huruf kecil
CREATE UNIQUE INDEX service_alias_normalized_unique
  ON "ServiceAlias" ("service_id", lower(phrase));

-- Pencarian typo
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX service_title_trgm ON "Service" USING GIN (title gin_trgm_ops);
CREATE INDEX service_alias_phrase_trgm ON "ServiceAlias" USING GIN (phrase gin_trgm_ops);
CREATE INDEX service_title_fts ON "Service" USING GIN (to_tsvector('indonesian', title));
CREATE INDEX service_version_summary_fts ON "ServiceVersion"
  USING GIN (to_tsvector('indonesian', summary));
```

Verifikasi konfigurasi FTS `indonesian` tersedia di PostgreSQL 18.6. Jika tidak, gunakan `simple` dan catat sebagai ADR.

### 10.2 Aturan penghapusan

| Relasi | Aturan | Alasan |
|---|---|---|
| User → ServiceCase | `Cascade` | Privasi; hapus akun menghapus case/progress |
| ServiceCase → RequirementProgress/StepProgress | `Cascade` | Progres tidak bermakna tanpa case |
| User → ContentReport.reporter | `SetNull` | Laporan tetap ada untuk kualitas konten, tanpa identitas |
| User → ContentRevision.author/reviewer | `Restrict` untuk author admin aktif; `SetNull` untuk reviewer opsional | Jejak editorial tidak boleh hilang; admin dinonaktifkan, bukan dihapus |
| ServiceCase → ServiceVersion | `Restrict` | Versi historis tidak boleh dihapus |
| ServiceVersion → Requirement/WorkflowStep/OfficialHandoff/VersionSource | `Cascade` hanya untuk versi DRAFT yang belum pernah dipublikasikan | Versi PUBLISHED/ARCHIVED tidak boleh dihapus |
| Service → ServiceVersion | `Restrict` | Mencegah kehilangan riwayat |

### 10.3 Validasi lintas tabel

`RequirementProgress.requirement_id` dan `StepProgress.workflow_step_id` **harus** berasal dari `ServiceCase.service_version_id` yang sama. FK biasa tidak menjamin ini. Implementasi:

1. Server action memuat case + item dalam satu transaksi.
2. Bandingkan `item.service_version_id === case.service_version_id`.
3. Tolak dengan error aman jika berbeda.
4. Integration test menembak ID versi lain dan memastikan tidak ada perubahan data.

Pertimbangan trigger database dicatat sebagai residual risk, bukan blocker MVP (lihat `ARCHITECTURE.md`).

### 10.4 Transaksi publish

Urutan dalam satu transaksi:

1. Kunci logis kandidat (update bersyarat status `IN_REVIEW`).
2. Validasi sumber, verified_at/by, reviewer, handoff, requirement, step.
3. Arsipkan versi `PUBLISHED` lama (`status = ARCHIVED`).
4. Set kandidat `PUBLISHED`, `published_at = now()`.
5. Insert `ContentRevision` (PUBLISH) dan `AuditEvent`.
6. Commit. Jika unique index gagal, rollback dan tampilkan error yang aman.

### 10.5 Versi usang pada case

- Case menyimpan snapshot `service_version_id`.
- Query dashboard membandingkan dengan versi PUBLISHED terbaru per service dalam satu query batch.
- Jika berbeda, tampilkan banner `Panduan diperbarui` + tanggal + tautan ke versi baru.
- Tidak ada migrasi otomatis; pengguna dapat membuat case baru dari versi terbaru.
- Case lama tetap dapat dibaca meskipun versinya ARCHIVED.

### 10.6 Data yang dilarang

Tidak ada kolom/tabel untuk:

- NIK, nomor KK, nomor SIM, tanggal lahir, alamat detail;
- file/gambar/scan dokumen;
- isi surat pribadi;
- kredensial portal pemerintah;
- token/secret di audit atau log.

`ContentReport.message` dibatasi 20–1000 karakter, ditolak jika mengandung pola 16 digit berurutan (indikasi NIK/KK), dan diberi peringatan agar tidak mengirim data pribadi.

---

## 11. Matriks penanganan data sensitif

| Data | Disimpan? | Lokasi | Catatan |
|---|---|---|---|
| Email akun | Ya | `User.email` | Diperlukan login; tidak di log; lowercase |
| Nama tampilan | Opsional | `User.display_name` | Boleh kosong |
| Session token | Ya | `Session.sessionToken` (hash? disimpan oleh adapter) | Cookie HttpOnly; rotasi saat logout |
| Progres checklist/langkah | Ya | `RequirementProgress`, `StepProgress` | Boolean/enum + timestamp; tanpa isi dokumen |
| Laporan ketidakakuratan | Ya | `ContentReport` | Tanpa identitas pelapor untuk guest; pesan dibatasi |
| Sumber resmi & metadata | Ya | `OfficialSource`, `VersionSource` | Publik; bukan data pribadi |
| Audit administratif | Ya | `AuditEvent`, `ContentRevision` | Tanpa PII/token/body |
| NIK/KK/SIM/scan/tanda tangan | **Tidak** | — | Ditolak/di luar schema |
| Isi surat/draf pribadi | **Tidak** | — | Hanya client-side jika template disetujui |
| Token magic link | Sementara | `VerificationToken` | Sekali pakai, expiry pendek; tidak di log |
| Email di URL magic link | Ya (bawaannya Auth.js) | URL callback | Perlu keputusan owner; `Referrer-Policy: no-referrer`, tanpa logging |

---

## 12. Risiko dan mitigasi

| ID | Risiko | Dampak | Mitigasi | Status |
|---|---|---|---|---|
| R-01 | Konten resmi belum diverifikasi; 8 skenario hanya DRAFT | Katalog publik kosong; pilot tidak bisa dianggap selesai | Owner/tim kurasi wajib memverifikasi sumber sebelum publish; jangan mengarang | **Blocker produk** |
| R-02 | Metode email produksi belum dipilih | Tidak bisa go-live | Mailpit hanya lokal; produksi gagal tertutup sampai provider disetujui | Blocker go-live |
| R-03 | Magic link Auth.js membawa email di query string | Risiko privasi/referrer | `no-referrer`, tanpa logging URL, expiry pendek; alternatif OTP perlu keputusan | Terbuka |
| R-04 | `pdf-lib` tidak aktif dipelihara sejak 2022 | Bug/keamanan jangka panjang | Client-only, tidak mem-parsing PDF eksternal, pin, monitor; siap ganti jika perlu | Residual |
| R-05 | Rate limit in-memory tidak berlaku multi-instance | Spam/brute force pada deployment multi-instance | Batasi MVP ke satu instance; dokumentasikan; upgrade ke shared store sebelum scale-out | Residual |
| R-06 | Tidak ada error monitoring SaaS | Insiden sulit dideteksi | Structured logs + audit + healthcheck; monitoring produksi keputusan owner | Residual |
| R-07 | Next 16/Prisma 7/React 19 masih relatif baru | Inkompatibilitas toolchain | Pin, test gate, fallback ke versi sebelumnya dengan persetujuan owner | Terkendali |
| R-08 | PostgreSQL lokal host listen 0.0.0.0:5432 | Paparan jaringan lokal | Proyek memakai Docker 127.0.0.1:5433; tidak mengubah host | Operasional |
| R-09 | Docker Desktop belum berjalan | Phase 1 terblokir | Owner menyalakan Docker Desktop; fallback DB lokal terisolasi | Operasional |
| R-10 | `npm audit` penuh belum bisa dijalankan (belum ada package.json) | Kerentanan transitif belum diketahui | Audit setelah install; gate wajib; status `NOT_VERIFIED` sampai itu | Terbuka |
| R-11 | Auth.js v4 dalam mode maintenance; v5 beta | Patch keamanan v4 mungkin terbatas | Pantau advisory; siap migrasi ke v5 stabil | Residual |
| R-12 | Tidak ada 2FA untuk admin | Kompromi email admin = kompromi konten | Magic link + email yang aman; 2FA/TOTP sebagai backlog pasca-MVP | Residual |
| R-13 | Pencarian bahasa Indonesia bergantung konfigurasi FTS | Hasil kurang relevan | Alias kurasi + trigram + test; fallback `simple` | Terkendali |
| R-14 | Legal/UU PDP/PSE belum direview | Risiko kepatuhan | Owner wajib review sebelum pilot publik | Blocker go-live |

---

## 13. Gap dan ketidaksesuaian dokumen

| ID | Temuan | Dampak | Rekomendasi |
|---|---|---|---|
| G-01 | Nama file kontrak adalah `AGENTS_URUSIN_v1.1.md`, bukan `AGENTS.md` | Tooling/agent mungkin tidak menemukan | Pertahankan sebagai source; rename/copy hanya dengan persetujuan owner |
| G-02 | Urutan fase master prompt (dokumen sebelum admin) berbeda dengan AGENTS (admin sebelum dokumen) | Kebingungan prioritas | Gunakan urutan AGENTS yang dimodifikasi: admin Phase 4, dokumen Phase 5 |
| G-03 | PRD §8.1 menyebut checklist sementara guest; ERD tidak punya case guest | Scope ambigu | Tunda guest checklist; CTA "Masuk untuk menyimpan" (D-11) |
| G-04 | PRD §15 belum mengunci metode auth email | Implementasi bisa salah asumsi | Magic link + Mailpit lokal; provider produksi keputusan owner |
| G-05 | ERD §6 melarang data sensitif di URL; Auth.js menaruh email di callback URL | Konflik privasi | Terima untuk alur auth dengan `no-referrer`/tanpa log, atau ganti OTP kustom (perlu keputusan) |
| G-06 | `AuditEvent` tidak punya kolom detail/metadata | Audit perubahan kurang informatif | Usulkan `detail String? @db.VarChar(500)` yang disanitasi; butuh persetujuan ERD |
| G-07 | `ContentReport` tidak punya `updated_at`/`resolved_at` | Triage/SLA sulit diukur | Usulkan tambahan timestamp; alternatif pakai AuditEvent |
| G-08 | ERD hanya mewajibkan sumber/handoff untuk publish; tidak menyebut requirement/step minimal | Bisa publish prosedur kosong | Usulkan validasi minimal 1 requirement + 1 step saat publish |
| G-09 | Constraint satu PUBLISHED tidak bisa diekspresikan Prisma schema | Duplikasi versi aktif | Partial unique index di migrasi SQL |
| G-10 | ERD `ServiceAlias` tidak punya kolom normalized | Duplikasi alias/sinonim | Unique expression index `lower(phrase)` |
| G-11 | ERD menyebut admin tidak boleh melihat case tanpa kebutuhan sah; tidak ada alur dukungan | Admin mungkin mengakses data warga | MVP: admin tidak punya akses case sama sekali |
| G-12 | Penghapusan user vs audit editorial | FK audit bisa bentrok | Citizen hard-delete; admin dinonaktifkan (soft-delete); reviewer `SetNull` |
| G-13 | PRD meminta error monitoring; zero-cost melarang SaaS berbayar | Observability produksi terbatas | Log + audit lokal; monitoring produksi keputusan/biaya owner |
| G-14 | PRD menyebut PWA; tidak ada tujuan offline | Scope creep/risiko cache | Manifest saja; tanpa service worker di MVP |
| G-15 | PRD menyebut "tabel sinonim"; ERD hanya `ServiceAlias` | Implementasi bisa menambah tabel tak perlu | Gunakan `ServiceAlias` sebagai sinonim pencarian |
| G-16 | Docker daemon mati; port 5432 terpakai | Phase 1 terblokir | Nyalakan Docker; pakai 5433; jangan sentuh PG host |
| G-17 | Prisma CLI `latest` menunjuk RC 8 | `npm i prisma` tanpa versi = RC | Pin eksak 7.10.1; larang instalasi tanpa versi |
| G-18 | `@auth/core` 0.34.3 punya advisory Critical/High | Jika terpasang, release blocker | Jangan pasang; gate `npm ls @auth/core` kosong |
| G-19 | `nodemailer` 7/8 terdampak banyak advisory | Email auth rentan | Tidak dipakai; custom Mailpit transport dev-only |
| G-20 | Data resmi belum tersedia | Tidak ada konten yang boleh publish | Owner wajib menyediakan sumber terverifikasi sebelum pilot |

---

## 14. Keputusan owner yang diperlukan sebelum Phase 1

| # | Pertanyaan | Rekomendasi default | Konsekuensi jika tidak diputuskan |
|---|---|---|---|
| O-01 | Setujui matriks versi (Next 16.4.6, React 19.3.1, TS 5.9.3, Prisma 7.10.1, Auth.js v4) | Setujui | Phase 1 tidak dimulai |
| O-02 | Setujui Auth.js v4 + custom email provider + Mailpit; provider produksi nanti | Setujui | Auth tidak dapat dibangun |
| O-03 | Setujui penundaan guest checklist | Setujui | Scope Phase 3 membengkak |
| O-04 | Setujui ERD amendment: `AuditEvent.detail` (sanitized) dan opsional `ContentReport.updated_at/resolved_at` | Setujui `detail`; timestamp opsional | Audit kurang informatif |
| O-05 | Setujui urutan fase: admin (4) sebelum dokumen (5) | Setujui | Katalog tidak bisa diisi sebelum dokumen |
| O-06 | Setujui PDF hanya checklist/lembar persiapan; tanpa template surat pribadi | Setujui | Risiko data sensitif meningkat |
| O-07 | Setujui rate limit in-memory untuk MVP single-instance | Setujui | Perlu Redis/shared store (di luar scope) |
| O-08 | Setujui tidak ada error monitoring SaaS; monitoring produksi ditunda | Setujui | Observability produksi terbatas |
| O-09 | Tentukan siapa yang berwenang review/publish dan jadwal verifikasi konten | Owner/tim kurasi | Tidak ada konten yang boleh publish |
| O-10 | Konfirmasi Docker Desktop dapat dijalankan dan port 5433 boleh dipakai | Konfirmasi | Phase 1 terblokir |
| O-11 | Konfirmasi penggunaan free tier GitHub Actions | Konfirmasi | CI tidak dapat dijalankan |
| O-12 | Setujui penanganan email di URL magic link atau minta OTP kustom | Terima magic link dengan `no-referrer` | Perlu desain auth tambahan |
| O-13 | Review UU PDP/PSE dan identitas pengelola sebelum pilot publik | Lakukan sebelum go-live | Pilot publik berisiko |
| O-14 | Setujui kebijakan retensi/penghapusan (mis. case terhapus dipurge 30 hari) | 30 hari, script manual | Kebijakan privasi tidak jelas |

---

## 15. Gate kualitas dan format laporan akhir fase

Setiap akhir fase, laporkan **fakta**:

1. Fitur yang selesai dan yang tidak.
2. File dibuat/diubah.
3. Migrasi database dan cara reproduksi.
4. Perintah test yang dijalankan beserta output ringkas.
5. Hasil audit dependency/CVE atau `NOT_VERIFIED` beserta alasan.
6. Perubahan konfigurasi keamanan.
7. Risiko residual dan bug yang masih ada.
8. Perubahan dari rencana awal.
9. Kesiapan melanjutkan fase berikutnya.

Gate minimum:

- `lint`, `typecheck`, `test`, `build` lulus.
- E2E alur kritis lulus (mulai Phase 2/3).
- `npm audit --audit-level=high` dijalankan.
- OSV-Scanner/Trivy dijalankan bila relevan; jika gagal/offline, tulis `NOT_VERIFIED`.
- Negative tests keamanan lulus.
- Tidak ada data sensitif di DB/log/URL/browser storage.
- Mobile + keyboard + error/loading/empty state.
- Dependency baru tercatat di `docs/DEPENDENCY_SECURITY.md`.

---

## 16. Change control

- Tidak menambah fitur P2, layanan baru, atau integrasi pemerintah tanpa persetujuan owner.
- Perubahan ERD harus disertai alasan teknis, dampak migrasi, dan pembaruan dokumen.
- Major upgrade dependency memerlukan evaluasi, test regresi, dan persetujuan owner.
- `npm audit fix --force` dilarang.
- Perubahan scope ditolak secara default; catat sebagai backlog.

---

## 17. Definisi "selesai" untuk MVP

MVP dianggap selesai jika:

1. FR-01..FR-13 (P0 + P1 yang disetujui) dapat didemonstrasikan dengan data terverifikasi atau fixture `TEST` yang jelas.
2. Tidak ada upload/persistensi dokumen identitas.
3. Semua endpoint/aksi memeriksa role dan ownership.
4. Published version immutable dan satu aktif per service.
5. Katalog publik hanya menampilkan konten published yang valid.
6. Tidak ada klaim status pemerintah.
7. Audit dependency bersih dari Critical/High relevan atau residual risk disetujui owner.
8. Backup/restore dan rollback terbukti.
9. Owner menyetujui hasil pilot readiness dan kebijakan privasi.
