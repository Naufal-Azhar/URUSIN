# URUSIN

Pendamping persiapan pengurusan administrasi publik untuk warga Batam. URUSIN **bukan** situs resmi pemerintah, tidak menerbitkan dokumen resmi, dan tidak mengajukan permohonan ke instansi.

**Status:** Phase 1–4 — fondasi aplikasi, autentikasi/RBAC, katalog publik, workspace warga, admin kurasi, triage laporan, dan audit.

## Batas produk

- Tidak ada API pemerintah, bot, scraping login, atau kredensial instansi.
- Tidak ada upload/persistensi NIK, foto KTP/KK/SIM, tanda tangan, atau isi surat.
- Progres pengguna adalah catatan pribadi, bukan status instansi.
- Konten hanya tampil setelah sumber resmi diverifikasi dan dipublikasikan admin.

## Prasyarat

- Node.js 24+
- npm 12+
- Docker Desktop (untuk PostgreSQL 18.6 dan Mailpit)
- Port `5433` (PostgreSQL), `1025`/`8025` (Mailpit), dan `3000` (Next.js) tersedia.

## Setup lokal

```bash
# 1. Salin environment
cp .env.example .env
# Isi password lokal dan NEXTAUTH_SECRET. Jangan commit .env.

# 2. Jalankan database dan mail sink
docker compose up -d --wait

# 2b. Siapkan environment test (untuk integration test)
cp .env.test.example .env.test
# Sesuaikan password dengan .env

# 3. Instal dependency (termasuk dev)
npm ci --include=dev

# 4. Generate Prisma Client
npm run db:generate

# 5. Terapkan migrasi dan seed DRAFT
npm run db:deploy
npm run db:seed

# 6. Jalankan aplikasi
npm run dev
```

Buka `http://127.0.0.1:3000`. Mailpit: `http://127.0.0.1:8025`.

> Catatan: environment host di mesin pengembangan ini menetapkan `NODE_ENV=production` dan npm `omit=dev`. Selalu gunakan `npm ci --include=dev` untuk development. Untuk perintah yang membutuhkan mode development, set `NODE_ENV=development` pada shell.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Next.js development |
| `npm run build` | Build produksi (menjalankan `prisma generate`) |
| `npm run start` | Menjalankan build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm run test:unit` | Unit test (Vitest) |
| `npm run test:component` | Component test (RTL) |
| `npm run test:integration` | Integration test (PostgreSQL test) |
| `npm run test:e2e` | E2E Playwright |
| `npm run test:a11y` | Axe accessibility |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:deploy` | Terapkan migrasi |
| `npm run db:seed` | Seed 8 skenario DRAFT |
| `npm run db:seed:demo` | Seed data `CONTOH UJI` untuk demo/E2E (non-production) |
| `npm run audit:ci` | `npm audit --audit-level=high` |

## Database

- Development: `urusin` di `127.0.0.1:5433`.
- Test: `urusin_test`.
- Runtime role: `urusin_app` (DML, tanpa DDL).
- Migration role: `urusin_migrator` (DDL; `CREATEDB` untuk shadow database di development).
- Migrasi memakai `MIGRATE_DATABASE_URL`; aplikasi memakai `DATABASE_URL`.
- Migrasi SQL kustom mencakup partial unique index satu versi PUBLISHED, unique email/alias lowercase, dan index FTS/trigram.

## Seed

Seed hanya membuat 3 kategori, 8 Service, 8 ServiceVersion **DRAFT**, dan alias pencarian. Tidak ada persyaratan, biaya, sumber resmi, atau handoff yang dikarang. Katalog publik akan kosong sampai admin memverifikasi dan mempublikasikan konten.

Admin development dapat dibuat dengan `SEED_ADMIN_EMAIL=...` di `.env` (hanya non-production), atau dipromosikan melalui CLI server:

```bash
npm run admin:promote -- admin@example.test
```

CLI membuat user jika belum ada, mengubah role menjadi `ADMIN`, dan menulis `AuditEvent`. Jangan menjalankan tanpa otorisasi pada environment bersama/produksi.

## Keamanan

- Magic link email; tanpa password.
- Workspace warga: multi-case, checklist, progres langkah, version warning, arsip/hapus; setiap query case difilter berdasarkan `user_id`.
- Case menyimpan snapshot `service_version_id`; item dari versi lain ditolak saat update.
- Admin: draft → review → publish/archive transaksional; publish mewajibkan sumber, verifikasi, persyaratan, langkah, dan handoff. Versi terbit immutable.
- Laporan ditriase tanpa menampilkan identitas pelapor; setiap tindakan admin masuk `AuditEvent` tanpa PII.
- Tidak memasang `@auth/core` atau `nodemailer` karena advisory keamanan.
- Override `effect@3.22.1` untuk menambal advisory High transitive dari Prisma CLI; lihat `docs/DEPENDENCY_SECURITY.md`.
- Email lokal dikirim ke Mailpit melalui transport SMTP dev-only. Produksi gagal tertutup sampai provider email disetujui owner.
- Session database; cookie HttpOnly/SameSite=Lax/Secure di produksi.
- RBAC + ownership check (fondasi; fitur case di Phase 3).
- Security headers di `next.config.ts`.
- Rate limit in-memory (single-instance); `TRUST_PROXY=false` secara default. Set `true` hanya di belakang reverse proxy tepercaya yang menulis `X-Forwarded-For`.
- Tidak ada upload, rich text, atau penyimpanan dokumen identitas.

## Dokumentasi

- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DEPENDENCY_SECURITY.md`](docs/DEPENDENCY_SECURITY.md)
- [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md)
- [`docs/PRD_URUSIN_v1.md`](docs/PRD_URUSIN_v1.md)
- [`docs/ERD_URUSIN_v1.md`](docs/ERD_URUSIN_v1.md)
