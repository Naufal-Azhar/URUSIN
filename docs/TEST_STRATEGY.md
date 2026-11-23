# Test Strategy — URUSIN MVP v1.1

**Status:** DRAFT — rencana, belum ada test yang dijalankan  
**Tanggal:** 2026-11-23  
**Tools:** Vitest, React Testing Library, Playwright, axe-core, PostgreSQL nyata, Mailpit  
**Prinsip:** test membuktikan invariant keamanan, bukan sekadar coverage.

---

## 1. Tujuan

Test harus membuktikan:

1. Guest hanya bisa membaca katalog published dan mengirim laporan.
2. Warga hanya bisa mengakses case miliknya; BOLA/IDOR gagal.
3. Progres tidak bisa diubah untuk item dari versi lain (tampering).
4. Published version immutable; hanya satu PUBLISHED per service.
5. Publish tanpa sumber/verifikasi/reviewer/handoff/requirement/step ditolak.
6. Tidak ada data sensitif di DB, log, URL, atau browser storage.
7. Input berbahaya (XSS, SQLi, open redirect, URL scheme) ditolak/di-escape.
8. UI dapat digunakan di mobile, keyboard, dan pembaca layar dasar.
9. Alur kritis berfungsi end-to-end dengan data sah/fixture berlabel.
10. Dependency dan image tidak memiliki Critical/High relevan sebelum release.

---

## 2. Piramida test

| Level | Tool | Cakupan | Kecepatan | Jumlah |
|---|---|---|---|---|
| Unit | Vitest (node) | Schema, validator, state machine, helper, sanitizer, search normalization | Cepat | Banyak |
| Integration | Vitest + PostgreSQL nyata | Constraint, transaksi, query, adapter auth, ownership, publish | Sedang | Sedang |
| Component | Vitest + jsdom + RTL | Form, checklist, error/loading/empty state, aksesibilitas dasar | Cepat–sedang | Sedang |
| E2E | Playwright | Alur guest/warga/admin, auth magic link, BOLA, PDF, a11y | Lambat | Sedikit, kritis |
| Security | Vitest/Playwright/CLI | Authz matrix, injection, header, rate limit, log redaction, dependency | Sedang | Terarah |
| Performance | Playwright trace + Lighthouse lokal | LCP/CLS, query count, ukuran JS | Lambat | Terbatas |
| Manual | Checklist | Keyboard, screen reader, kontras, review konten | Manual | Per fase |

Tidak mengejar coverage angka sebagai tujuan utama. Coverage dilaporkan, tetapi gate utama adalah invariant dan negative test.

---

## 3. Lingkungan test

### 3.1 Local

```text
PostgreSQL 18.6 Docker  127.0.0.1:5433
Mailpit                 127.0.0.1:1025 (SMTP), 127.0.0.1:8025 (UI/API)
Next.js dev             127.0.0.1:3000
```

- Database utama: `urusin`.
- Database test: `urusin_test`.
- Database restore test: `urusin_restore_test`.
- Port 5432 host **tidak dipakai** (sudah ditempati PostgreSQL lokal).

### 3.2 CI

- Runner Ubuntu, Node 24.
- PostgreSQL 18 service container (atau Docker Compose).
- Mailpit container.
- `npm ci`, `db:generate`, `db:deploy`, seed test.
- Playwright Chromium (dan WebKit/Firefox opsional pada Phase 6).

### 3.3 Environment variables test

```text
NODE_ENV=test
APP_ENV=test
DATABASE_URL=postgresql://urusin_app:...@127.0.0.1:5433/urusin_test
MIGRATE_DATABASE_URL=postgresql://urusin_migrator:...@127.0.0.1:5433/urusin_test
NEXTAUTH_URL=http://127.0.0.1:3000
NEXTAUTH_SECRET=<random test-only>
EMAIL_TRANSPORT=mailpit
EMAIL_SERVER_HOST=127.0.0.1
EMAIL_SERVER_PORT=1025
EMAIL_FROM=URUSIN Test <no-reply@urusin.test>
OFFICIAL_DOMAIN_ALLOWLIST=example.com
```

- Tidak ada secret produksi di test.
- Test tidak boleh mengakses jaringan eksternal (kecuali instalasi dependency).
- Mailpit API dipakai untuk mengambil magic link.

---

## 4. Data test

### 4.1 Aturan

- **Tidak ada data warga nyata.**
- Email memakai domain `example.test`/`example.com`, nama `TEST ...`.
- URL sumber memakai `https://example.com/...` dengan label `TEST`.
- Tidak ada NIK/KK/SIM asli; jika perlu payload, gunakan angka dummy yang jelas dan tidak valid.
- Screenshot/test artifact tidak boleh berisi data nyata.
- Seed produksi hanya DRAFT; seed demo/test terpisah.

### 4.2 Factory

Buat factory kecil dan eksplisit:

```text
createUser({ role, email? })
createCategory({ slug })
createService({ code, slug, category })
createVersion({ service, status, verified? })
createRequirement({ version, order })
createStep({ version, order })
createSource({ version, url, verifiedAt, verifiedBy })
createHandoff({ version, url, channel })
createCase({ user, version, status? })
createReport({ service, reporter? })
```

Aturan factory:

- Default aman (DRAFT, belum verified).
- Untuk membuat PUBLISHED valid, factory harus menambahkan sumber + verified + reviewer + handoff + requirement + step.
- Jangan membuat helper yang diam-diam mempublikasikan konten tanpa komponen wajib.
- Setiap factory mengembalikan id untuk assertion.

### 4.3 Isolasi database

- Integration test memakai database test terpisah.
- Strategi: migrasi sekali per run, truncate tabel di antara test (kecuali tabel referensi statis).
- Gunakan transaksi rollback jika memungkinkan; untuk test concurrent publish, butuh commit nyata.
- Test tidak boleh berjalan paralel yang mengubah tabel yang sama tanpa isolasi; gunakan `describe.sequential` atau database per worker jika perlu.
- Playwright memakai database test yang di-reset sebelum suite.

---

## 5. Matriks test per FR

| FR | Unit | Integration | Component | E2E | Security |
|---|---|---|---|---|---|
| FR-01 katalog/search | normalisasi, ranking, empty | published-only, SQLi, trigram | search form, empty/loading | guest search + kategori | payload SQLi/XSS |
| FR-02 detail | URL/scheme validation | query detail, sumber/handoff | render syarat/langkah/disclaimer | buka detail + handoff | XSS, link scheme |
| FR-03 workspace | state transition | ownership, multi-case | dashboard cards | login → tambah case | BOLA |
| FR-04 checklist | boolean schema | unique/upsert, cross-version | checkbox, error | toggle + persist | tampering |
| FR-05 langkah | enum transition | cross-version, idempotent | radio/status, aria | update status | tampering |
| FR-06 handoff | allowlist/domain | hanya published valid | external link label | klik link (mock) | open redirect/SSRF |
| FR-07 admin kurasi | role guard | CRUD draft, transaksi | form admin | draft → review | RBAC |
| FR-08 sumber/versi | publish validation | one-active, immutable, audit | editor | publish → public | race/immutability |
| FR-09 laporan | message/NIK validator | rate limit, reporter null | form guest | kirim + triage | spam/honeypot |
| FR-10 auth/RBAC | redirect validator, email normalizer | session, role, ownership | login form | magic link, logout | enumeration, CSRF |
| FR-11 PDF | content builder | — | tombol/unduh | generate, no network | no persistence |
| FR-12 next action | calculation | query progress | banner | dashboard | — |
| FR-13 riwayat | transitions | archive/delete | dialog | archive/delete | ownership |
| FR-14 typo | similarity | trigram | — | search typo | — |
| FR-15/16 P2 | — | — | — | — | di luar MVP |

---

## 6. Unit test plan

### 6.1 Validasi dan keamanan

- Email: NFKC, trim, lowercase, ASCII, tepat satu `@`, panjang, homoglyph ditolak.
- URL: `http/https` hanya; `javascript:`, `data:`, `file:`, credentials, spasi, karakter kontrol ditolak; hostname wajib.
- Slug/code/version/order/enum.
- Pesan laporan: min/max, NIK 16 digit ditolak, kontrol karakter.
- Redirect callback: relatif saja; `//evil`, `https://evil`, `\evil`, encoded bypass ditolak.
- Filename PDF: sanitasi; tidak ada path traversal.
- Search input: trim/lowercase/max; karakter kontrol; wildcard SQL tidak berpengaruh.

### 6.2 Domain

- State machine `ServiceVersion`: transisi valid/invalid.
- State machine `ServiceCase`: transisi valid/invalid.
- `isStepDone`, `nextAction`, progress percentage (jika ada) — hindari pembulatan menyesatkan.
- Publish validation: daftar syarat wajib; error per field.
- Version staleness: case vs latest published.
- Rate limiter: window, key hashing, expiry, isolation per key.
- Logger redaction: field sensitif tidak muncul.

### 6.3 Auth

- Normalisasi email konsisten di sign-in, adapter, dan verification token.
- Callback URL validation.
- Session mapping role.
- Ownership helper mengembalikan null untuk user lain.
- Magic link provider menolak email tidak ternormalisasi/URL origin salah.

### 6.4 Search

- Ranking exact code/title > alias > FTS > fuzzy.
- Query kosong/terlalu pendek.
- Tidak ada hasil → array kosong, bukan fallback karangan.
- Sinonim `ktp hilang`/`ktp ilang`.
- Hanya published (unit level dapat mock query builder; integration membuktikan).

---

## 7. Integration test plan

Semua integration memakai PostgreSQL nyata, bukan mock Prisma.

### 7.1 Schema dan constraint

- Migrasi dari database kosong berhasil.
- Unique `User.email`; email lowercase.
- Unique `Service.code`, `Service.slug`.
- Unique `(service_id, version_number)`.
- Partial unique: dua insert PUBLISHED untuk service sama → gagal.
- Unique `(case_id, requirement_id)` dan `(case_id, step_id)`.
- FK menghalangi hapus versi yang direferensikan case.
- Cascade user → case → progress.
- `ContentReport.reporter_id` menjadi NULL saat user dihapus.
- Expression index alias menolak duplikat case-insensitive.
- FTS/trigram index ada dan query memakai index (EXPLAIN).

### 7.2 Auth adapter

- `createUser` menyimpan email lowercase dan role default CITIZEN.
- `getUserByEmail` menemukan meskipun input beda kapital.
- Verification token dibuat, dipakai sekali, expiry dihormati.
- Session dibuat/dihapus; `getSessionAndUser` mengembalikan role.
- User deleted → session tidak valid.

### 7.3 Publish

- Publish valid: versi lama ARCHIVED, kandidat PUBLISHED, revision + audit tercatat.
- Publish tanpa sumber → gagal, tidak ada perubahan.
- Publish tanpa verified_at/by → gagal.
- Publish tanpa handoff valid → gagal.
- Publish tanpa requirement/step → gagal (jika disetujui).
- Publish dua bersamaan → satu sukses, satu gagal; tetap satu PUBLISHED.
- Update konten versi PUBLISHED via query langsung → ditolak oleh aturan aplikasi; test memastikan tidak ada action yang membukanya.
- Takedown → ARCHIVED + audit; case menampilkan warning.

### 7.4 Ownership/BOLA

- User A create case; User B `getOwnedCase` → null/404.
- User B update progress case A → ditolak, data tidak berubah.
- User B delete/archive case A → ditolak.
- Guest action → ditolak.
- Admin action pada case → tidak tersedia/ditolak.
- ID enumeration tidak membocorkan keberadaan (respons sama untuk tidak ada vs bukan milik).

### 7.5 Progress tampering

- Requirement dari versi lain → ditolak.
- Step dari versi lain → ditolak.
- Requirement dari service lain → ditolak.
- Item dihapus/diarsipkan → ditolak dengan aman.
- Upsert berulang idempotent.
- Concurrent upsert tidak menghasilkan duplikat.

### 7.6 Query dan performa data

- Dashboard hanya mengembalikan case milik user.
- Hanya versi PUBLISHED valid yang muncul di katalog.
- Versi PUBLISHED tidak lengkap disembunyikan.
- Jumlah query untuk dashboard/detail di bawah budget.
- Tidak ada N+1 (query counter).
- Pagination tidak duplikat/hilang.

### 7.7 Laporan

- Guest dapat membuat laporan dengan `reporter_id NULL`.
- User login menyimpan reporter id.
- Rate limit per IP (simulasi) menolak melebihi batas.
- Honeypot terisi → ditolak.
- Pesan 16 digit → ditolak.
- Triage transition valid; audit tercatat tanpa PII.

### 7.8 Account deletion

- Hapus akun menghapus sesi/case/progress.
- Laporan tetap ada dengan reporter NULL.
- ContentRevision admin tidak terhapus; admin dinonaktifkan.
- Tidak ada email tersisa di audit.

---

## 8. Component test plan

- Form login: validasi, error summary, loading, pesan seragam.
- Form laporan: pilihan layanan, issue type, counter karakter, error NIK, honeypot tidak terlihat.
- Checklist: checkbox accessible, optimistic/error rollback, disabled saat pending.
- Step status: radio/segmented control dengan label jelas, keyboard.
- Dashboard card: progres, next action, version warning.
- Admin editor: field requirement/step/source/handoff, error publish per field.
- Empty/loading/error states.
- Tabel admin: pagination, empty, tidak render HTML dari data.
- PDF button: dynamic import, loading, error.
- Pastikan tidak ada teks "disetujui/ditolak/terverifikasi" untuk progres warga.

Gunakan `@testing-library/user-event`, bukan `fireEvent`, untuk interaksi.

---

## 9. E2E test plan (Playwright)

### 9.1 Guest

1. Buka `/`, cari `ktp hilang` → hasil relevan (fixture PUBLISHED TEST).
2. Buka detail → syarat, langkah, sumber, tanggal verifikasi, disclaimer, handoff.
3. Klik handoff → URL eksternal benar, `rel` benar (mock route).
4. Buka `/dashboard` → redirect `/masuk?callbackUrl=...`.
5. Kirim laporan valid → sukses; kirim dengan NIK → ditolak.
6. Kirim laporan berulang melebihi limit → ditolak.

### 9.2 Warga

1. Isi email → Mailpit menerima magic link → buka link → dashboard.
2. Tambah 2 case → keduanya tampil terpisah.
3. Tandai requirement dan step → refresh → progres persist.
4. Coba akses case user lain (dibuat via fixture) → 404.
5. Versi baru dipublikasikan (fixture/admin) → banner `Panduan diperbarui`, progres lama tidak berubah.
6. Arsipkan case → hilang dari daftar aktif.
7. Logout → dashboard redirect.
8. Hapus akun (Phase 5) → sesi berakhir, data hilang.

### 9.3 Admin

1. Login admin → `/admin`.
2. Buat service + draft version.
3. Publish tanpa sumber → error jelas.
4. Tambah sumber + verified + handoff + requirement + step → publish.
5. Katalog publik menampilkan versi baru.
6. Coba edit konten published → ditolak.
7. Buat versi baru → publish → versi lama ARCHIVED.
8. Triage laporan → status berubah + audit.
9. Citizen membuka `/admin` → 403/404.
10. Admin membuka case warga → tidak ada akses.

### 9.4 PDF dan mobile

1. Buka case → unduh PDF → file terunduh, isi teks benar, disclaimer ada.
2. Pantau network: tidak ada request berisi data pribadi.
3. Viewport 360×800: navigasi, form, checklist dapat digunakan.
4. Keyboard: tab order, focus visible, escape dialog.
5. axe pada `/`, `/layanan`, detail, `/masuk`, dashboard, admin.

### 9.5 Auth edge cases

- Email campuran huruf besar/kecil → dinormalisasi.
- Email dengan karakter Unicode homoglyph → ditolak.
- `callbackUrl=https://evil.example` → ditolak/diabaikan.
- Token dipakai dua kali → gagal.
- Token kedaluwarsa → gagal.
- Logout lalu back button → halaman terlindungi tidak menampilkan data.
- Session cookie flags diperiksa.

---

## 10. Security test plan

### 10.1 Matriks otorisasi

| Aksi | Guest | Citizen A | Citizen B | Admin |
|---|---|---|---|---|
| GET katalog published | 200 | 200 | 200 | 200 |
| GET katalog draft | 404 | 404 | 404 | 404 (kecuali admin view) |
| GET own case | redirect | 200 | 404 | 404 |
| UPDATE own progress | redirect | 200 | 404 | 404 |
| DELETE own case | redirect | 200 | 404 | 404 |
| GET /admin | 403/redirect | 403/404 | 403/404 | 200 |
| Publish | 403 | 403 | 403 | 200 (jika valid) |
| Create report | 200 (rate-limited) | 200 | 200 | 200 |
| Read audit | 403 | 403 | 403 | 200 |

Test harus memeriksa **status dan data**, bukan hanya status.

### 10.2 Injeksi dan output

- XSS payload di judul, ringkasan, guidance, pesan laporan, nama tampilan → tidak ada script execution; HTML di-escape.
- SQLi payload di search (`' OR 1=1--`, `%`, `_`, unicode) → hasil aman, tidak error 500.
- CRLF injection pada header email/nama file → ditolak.
- Path traversal pada filename PDF → tidak terjadi.
- JSON body besar (>100 KB) → ditolak.
- Content-Type tidak valid → ditolak.
- Prototype pollution payload pada form/JSON → tidak mempengaruhi object.

### 10.3 CSRF dan origin

- POST Server Action dari origin lain → ditolak.
- Auth route tanpa CSRF token → ditolak.
- Cookie SameSite=Lax; tidak ada state-changing GET.
- Logout POST/CSRF sesuai Auth.js.

### 10.4 Redirect dan tautan

- `callbackUrl` relatif valid.
- `//evil.com`, `https://evil.com`, `/%2f%2fevil.com`, backslash, whitespace → ditolak.
- Handoff URL scheme allowlist.
- Domain allowlist publish.
- External link `target=_blank` + `rel=noopener noreferrer`.

### 10.5 Header dan cookie

- CSP hadir; tidak ada `unsafe-eval`; script nonce.
- HSTS hanya produksi HTTPS.
- X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors.
- Cookie: HttpOnly, Secure (prod), SameSite=Lax, path benar.
- Tidak ada `X-Powered-By`.
- Error page tidak membocorkan stack.

### 10.6 Log dan privasi

- Log tidak mengandung email, token, cookie, Authorization, isi laporan, query mentah.
- Error internal tidak dikirim ke client.
- Audit tidak mengandung PII.
- Browser storage: tidak ada PII setelah logout/PDF.
- URL: tidak ada NIK/token di path/query selain magic link yang diperlukan.

### 10.7 Rate limit

- Login per IP/email.
- Laporan per IP.
- Mutasi per user.
- Reset window setelah waktu.
- Key tidak menyimpan IP mentah.

### 10.8 Dependency dan supply chain

- `npm ls @auth/core` kosong.
- `npm ls nodemailer` kosong.
- `npm audit --audit-level=high`.
- OSV-Scanner lockfile.
- Trivy image app + PostgreSQL.
- Secret scan (gitleaks/Trivy fs).
- Lockfile tidak berubah tanpa review.

---

## 11. Accessibility test plan

Target: WCAG 2.2 AA.

Otomatis:

- axe pada halaman: `/`, `/layanan`, `/layanan/[slug]`, `/laporkan`, `/masuk`, `/dashboard`, `/pengurusan/[id]`, `/admin/layanan`, `/admin/laporan`.
- Tidak ada violation critical/serious.
- Heading order, landmark, label, alt, contrast.

Manual:

- Keyboard-only: semua aksi dapat dilakukan; focus visible; tidak ada trap.
- Screen reader dasar (NVDA/VoiceOver): form error terbaca; checklist/step status terbaca.
- Zoom 200% dan 400%: tidak ada horizontal scroll yang menghalangi.
- `prefers-reduced-motion`.
- Status tidak hanya warna.
- Touch target >=44px pada mobile.
- Bahasa `lang="id"`; istilah konsisten.
- PDF: teks dapat dibaca/dipilih; metadata bahasa.

---

## 12. Performance test plan

### 12.1 Frontend

- Build produksi (`next build` + `next start`), bukan dev server.
- Playwright Chromium, viewport mobile dan desktop.
- Ukur LCP, CLS, INP/TBT, ukuran JS/CSS.
- 5 run, ambil median; catat lingkungan.
- Target awal: p75 LCP <=2.5s pada kondisi yang didefinisikan; bukan klaim produksi.
- Pastikan tidak ada layout shift font/gambar.
- Public page tidak memuat library client besar (PDF hanya dynamic import saat dibutuhkan).

### 12.2 Database

- `EXPLAIN (ANALYZE, BUFFERS)` untuk:
  - katalog published;
  - search FTS/trigram;
  - dashboard user;
  - case detail;
  - publish transaction.
- Pastikan index terpakai; tidak ada Seq Scan pada tabel besar (setelah data uji diperbanyak).
- Query count budget:
  - katalog <=3;
  - dashboard <=5;
  - case detail <=4;
  - publish <=10 dalam transaksi.
- Uji dengan 100–1000 case fixture untuk mendeteksi N+1.
- Tidak ada query di dalam loop render.

### 12.3 Beban

- Tidak ada load test penuh di MVP; fokus pada query dan bundle.
- Jika pilot publik: tambah uji beban ringan dan rate limit, keputusan owner.

---

## 13. CI pipeline

### 13.1 Urutan

```text
1. checkout
2. setup Node 24 + cache npm
3. npm ci
4. npm run db:generate
5. npm run lint
6. npm run typecheck
7. npm run test:unit
8. start PostgreSQL 18 + Mailpit
9. npm run db:deploy (database test)
10. npm run db:seed:test
11. npm run test:integration
12. npm run build
13. npx playwright install --with-deps chromium
14. npm run test:e2e
15. npm run test:a11y (jika dipisah)
16. npm audit --audit-level=high
17. npx osv-scanner --lockfile=package-lock.json
18. upload artifacts (coverage, playwright report, audit json)
```

Gate:

- Lint/typecheck/test/build/E2E wajib lulus.
- Audit Critical/High relevan wajib nol.
- OSV/Trivy jika gagal/offline → `NOT_VERIFIED`, bukan "lulus".
- Playwright trace/screenshot disimpan saat gagal.
- Coverage dilaporkan; tidak menutupi test yang gagal.

### 13.2 Free-tier dan zero-cost

- GitHub Actions free tier untuk repo publik/kuota gratis.
- Tidak mengaktifkan paid runner, code scanning berbayar, atau layanan tambahan.
- Jika kuota habis, jalankan gate yang sama secara lokal dan catat.
- Jangan menggunakan SaaS email/monitoring berbayar di CI.

### 13.3 Pinning

- GitHub Actions dipin ke commit SHA (supply chain), bukan tag bergerak.
- Node version dipin.
- Docker image test dipin tag/digest.
- `npm ci` hanya dari lockfile.

---

## 14. Perintah test yang direncanakan

```bash
# setup
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed

# kualitas
npm run lint
npm run typecheck

# test
npm run test:unit
npm run test:integration
npm run test:component
npm run test:e2e
npm run test:a11y

# build
npm run build

# keamanan
npm audit --audit-level=high
npx osv-scanner --lockfile=package-lock.json
npx trivy image --severity HIGH,CRITICAL urusin:local

# backup
npm run backup
npm run restore:test
```

Script belum ada; akan dibuat pada fase terkait. Jangan mengklaim perintah berhasil sebelum dijalankan.

---

## 15. Bukti dan pelaporan

Setiap fase menyertakan:

- Perintah yang dijalankan.
- Exit code.
- Ringkasan output (bukan hanya "lulus").
- Jumlah test lulus/gagal/skip dan alasan skip.
- Coverage (jika relevan).
- Playwright report/trace untuk kegagalan.
- Audit JSON dan advisory yang tersisa.
- Screenshot/a11y report untuk halaman kritis.
- Catatan lingkungan (OS, Node, PostgreSQL, browser).

Format laporan:

```text
Fase: ...
Tanggal: ...
Perintah: ...
Hasil: PASS/FAIL/NOT_VERIFIED
Test: X passed, Y failed, Z skipped (alasan)
Temuan keamanan: ...
Residual risk: ...
Perubahan dari rencana: ...
```

---

## 16. Exit criteria per fase

### Phase 1

- [ ] Unit: env, email normalizer, redirect, rate limiter, logger.
- [ ] Integration: migrasi, constraint, auth adapter, session.
- [ ] E2E: magic link login, logout, RBAC guest/citizen/admin.
- [ ] `npm ls @auth/core`/`nodemailer` kosong.
- [ ] Lint/typecheck/build/test lulus.

### Phase 2

- [ ] Integration: published-only, versi tidak lengkap tersembunyi, search.
- [ ] Component: search/empty/error.
- [ ] E2E: guest search + detail + handoff.
- [ ] Security: SQLi/XSS/URL scheme.
- [ ] axe halaman publik.

### Phase 3

- [ ] Integration: ownership, cross-version tampering, multi-case, staleness.
- [ ] Component: checklist/step/dashboard.
- [ ] E2E: warga alur penuh + BOLA.
- [ ] Query budget.

### Phase 4

- [ ] Integration: publish transaction, one-active, immutability, reports, audit.
- [ ] E2E: admin publish + triage.
- [ ] Security: RBAC, race, NIK rejection.
- [ ] Audit sanitization.

### Phase 5

- [ ] PDF E2E tanpa network/persistence.
- [ ] Security headers/cookies/CSP.
- [ ] Rate limit.
- [ ] Account deletion.
- [ ] Backup/restore.
- [ ] axe + keyboard + kontras.
- [ ] Trivy/npm audit/OSV.

### Phase 6

- [ ] Semua suite penuh lulus.
- [ ] Security regression lengkap.
- [ ] Performance baseline dicatat.
- [ ] Dependency re-audit.
- [ ] Dokumentasi operasional.
- [ ] Owner sign-off.

---

## 17. Batasan dan hal yang tidak diuji

- Tidak ada pengujian beban produksi penuh.
- Tidak ada pengujian multi-instance rate limit.
- Tidak ada pengujian email deliverability nyata (Mailpit lokal).
- Tidak ada pengujian provider email produksi sampai dipilih owner.
- Tidak ada pengujian perangkat mobile fisik; emulasi viewport.
- Tidak ada pengujian screen reader otomatis penuh; manual terbatas.
- Tidak ada pengujian penetrasi eksternal; security testing internal.
- Tidak ada pengujian backup produksi terkelola; hanya lokal.
- Tidak ada jaminan bebas CVE; hanya gate dan triage.
- Tidak ada pengujian konten resmi karena konten belum diverifikasi.

---

## 18. Referensi

- `docs/PRD_URUSIN_v1.md`
- `docs/ERD_URUSIN_v1.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPENDENCY_SECURITY.md`
- `AGENTS_URUSIN_v1.1.md`
