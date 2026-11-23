# Dependency Security & CVE Report — URUSIN MVP

**Status:** DRAFT — pemeriksaan awal selesai, audit penuh **belum dijalankan**  
**Tanggal pemeriksaan:** 2026-11-23  
**Lingkungan:** Windows, Node.js 24.22.1, npm 12.0.2  
**Metode:** npm registry (`dist-tags`, `peerDependencies`, tarball), OSV API (`/v1/querybatch`, `/v1/vulns/{id}`), dokumentasi resmi Next.js/Prisma, dan inspeksi isi paket. `npm audit` belum dapat dijalankan karena repository belum memiliki `package.json`/lockfile.

> Dokumen ini **tidak** menyatakan aplikasi "100% aman". Yang dicatat adalah hasil pemeriksaan pada tanggal di atas, keterbatasannya, dan gate yang belum dijalankan.

---

## 1. Ringkasan status

| Area | Status |
|---|---|
| Versi direct dependency | Dipilih dan dipin; sebagian besar dicek OSV |
| Advisory Critical/High pada paket yang akan dipasang | Tidak ditemukan pada pemeriksaan direct package |
| `@auth/core` | **Tidak dipasang**; memiliki 1 Critical + 1 High + 1 Moderate |
| `nodemailer` | **Tidak dipasang**; 7.x/8.x terdampak banyak advisory |
| Transitive dependency | Sebagian terverifikasi — lockfile dibuat, `npm audit` 0; OSV-Scanner penuh belum |
| `npm audit --audit-level=high` | **PASS** — 0 vulnerabilities (2026-11-23, setelah override `effect@3.22.1`) |
| OSV-Scanner penuh | **NOT_VERIFIED** |
| Docker image scan (Trivy) | **NOT_VERIFIED** — image belum dipindai dengan Trivy |
| License review | Sebagian besar OSS permisif; lihat §4 |
| Zero-cost policy | Terpenuhi untuk development lokal; biaya produksi terpisah |

---

## 2. Kebijakan yang diterapkan

1. Pin versi stabil eksak; tidak memakai `latest`, RC, nightly, atau beta.
2. Lockfile `package-lock.json` wajib di-commit; instalasi memakai `npm ci`.
3. Tidak memakai `npm audit fix --force` atau major upgrade otomatis.
4. Critical/High yang **exploitable dan relevan** memblokir release sampai dimitigasi, diganti, atau disetujui owner sebagai residual risk.
5. Moderate/Low ditriase berdasarkan exploitability, exposure, dan dampak data.
6. `npm audit` kosong bukan bukti bebas CVE; advisory vendor dan OSV tetap diperiksa.
7. Dependency baru harus dicatat di dokumen ini sebelum atau saat ditambahkan.
8. Docker base image dipindai terpisah; audit npm tidak mencakup OS/image.
9. Jangan mencatat "lulus audit" jika scanner gagal/offline/belum dijalankan; tulis `NOT_VERIFIED`.

---

## 3. Matriks dependency runtime

Versi di bawah adalah **pin eksak** yang direncanakan. Semua dicek OSV pada 2026-11-23.

| Package | Versi | Lisensi | Status OSV direct | Catatan maintenance |
|---|---|---|---|---|
| `next` | 16.4.6 | MIT | CLEAN | Rilis 2026-11-22; stable |
| `react` | 19.3.1 | MIT | CLEAN | Rilis 2026-11-19 |
| `react-dom` | 19.3.1 | MIT | CLEAN | Sama |
| `next-auth` | 4.24.15 | ISC | CLEAN | v4 maintenance; v5 masih beta |
| `@next-auth/prisma-adapter` | 1.0.7 | ISC | CLEAN | Tipe masih mengacu `@prisma/client`; perlu wrapper/validasi |
| `@prisma/client` | 7.10.1 | Apache-2.0 | CLEAN | Stable; `latest` CLI menunjuk RC 8 |
| `@prisma/adapter-pg` | 7.10.1 | Apache-2.0 | CLEAN | Peer `pg` ^8.16.3 |
| `pg` | 8.23.1 | MIT | CLEAN | Driver PostgreSQL |
| `zod` | 4.6.7 | MIT | CLEAN | Validasi |
| `react-hook-form` | 7.92.0 | MIT | CLEAN | Form |
| `@hookform/resolvers` | 7.0.8 | MIT | CLEAN | Integrasi Zod |
| `pdf-lib` | 1.17.1 | MIT | CLEAN | **Rilis terakhir 2022-05-12**; maintenance risk |
| `lucide-react` | 1.78.0 | ISC | CLEAN | Ikon |
| `clsx` | 2.1.1 | MIT | CLEAN | Utility |
| `tailwind-merge` | 3.7.1 | MIT | CLEAN | Utility |
| `class-variance-authority` | 0.7.1 | MIT | CLEAN | Varian UI |
| `server-only` | 0.0.1 | MIT | CLEAN | Guard import server |
| `dotenv` | 18.0.10 | BSD-2-Clause | CLEAN | Dimuat `prisma.config.ts` |

## 4. Matriks dependency development

| Package | Versi | Lisensi | Status OSV direct |
|---|---|---|---|
| `typescript` | 5.9.3 | Apache-2.0 | CLEAN |
| `@types/node` | 24.19.2 | MIT | CLEAN |
| `@types/react` | 19.3.0 | MIT | CLEAN |
| `@types/react-dom` | 19.3.0 | MIT | CLEAN |
| `@types/pg` | 8.23.1 | MIT | CLEAN |
| `eslint` | 9.39.5 | MIT | CLEAN |
| `eslint-config-next` | 16.4.6 | MIT | CLEAN |
| `prettier` | 3.10.1 | MIT | CLEAN |
| `prettier-plugin-tailwindcss` | 0.8.1 | MIT | CLEAN |
| `tailwindcss` | 4.3.5 | MIT | CLEAN |
| `@tailwindcss/postcss` | 4.3.5 | MIT | CLEAN |
| `prisma` | 7.10.1 | Apache-2.0 | CLEAN |
| `tsx` | 4.23.15 | MIT | CLEAN |
| `vitest` | 5.1.1 | MIT | CLEAN |
| `@vitest/coverage-v8` | 5.1.1 | MIT | CLEAN |
| `vite` | 8.3.8 | MIT | CLEAN |
| `@vitejs/plugin-react` | 6.3.0 | MIT | CLEAN |
| `jsdom` | 31.0.1 | MIT | CLEAN |
| `@testing-library/react` | 16.3.3 | MIT | CLEAN |
| `@testing-library/dom` | 10.4.1 | MIT | CLEAN |
| `@testing-library/jest-dom` | 8.0.0 | MIT | CLEAN |
| `@testing-library/user-event` | 14.6.13 | MIT | CLEAN |
| `@playwright/test` | 1.65.1 | Apache-2.0 | CLEAN |
| `@axe-core/playwright` | 4.14.0 | MPL-2.0 | CLEAN |

Catatan lisensi:

- `dotenv` adalah BSD-2-Clause.
- `@axe-core/playwright` adalah MPL-2.0; hanya dev/test, tidak didistribusikan sebagai bagian runtime.
- Komponen shadcn/Radix yang ditambahkan kemudian harus dicatat; Radix umumnya MIT.
- `mailpit` (image) MIT; PostgreSQL image memakai PostgreSQL License.
- Verifikasi lisensi transitive dilakukan setelah lockfile terbentuk.

---

## 5. Temuan penting

### F-01 — `@auth/core@0.34.3`: Critical + High + Moderate (TIDAK DIPASANG)

`next-auth@4.24.15` mendeklarasikan `@auth/core` sebagai **optional peer dependency** dengan versi eksak `0.34.3`.

Advisory yang ditemukan OSV:

| ID | Severity | Ringkasan | Fixed |
|---|---|---|---|
| `GHSA-7rqj-j65f-68wh` | **CRITICAL** | Email normalizer memvalidasi sebelum Unicode normalization; homoglyph `@` dapat mengalihkan magic link | 0.41.3 |
| `GHSA-xmf8-cvqr-rfgj` | **HIGH** | `getToken()` melempar exception pada Bearer header malformed (DoS) | 0.41.3 |
| `GHSA-x445-f3h2-j279` | MODERATE | Cookie OAuth state/nonce/PKCE tidak terikat provider | 0.41.3 |

Analisis:

- `@auth/core` adalah peer **opsional**. npm tidak memasang optional peer secara otomatis.
- Inspeksi tarball `next-auth@4.24.15`: **tidak ada referensi runtime ke `@auth/core`** pada file JS.
- `next-auth@4` memiliki implementasi core sendiri; email flow tidak memakai paket tersebut.
- Karena itu, paket rentan tidak perlu dan **tidak akan** dipasang.

Mitigasi/gate:

```bash
npm ls @auth/core          # harus kosong
grep -R "@auth/core" package-lock.json   # hanya boleh metadata peer opsional, bukan resolved package
```

Jika muncul sebagai resolved package karena transitive/peer resolution:

1. Jangan jalankan `npm audit fix --force`.
2. Jangan memasang 0.34.3.
3. Evaluasi apakah bisa dihilangkan; jika tidak, eskalasi ke owner.
4. Critical/High = **release blocker** sampai diputuskan.

Catatan: memasang `@auth/core@0.41.3` (patched) di luar peer eksak v4 adalah kombinasi tidak didukung. Opsi ini hanya boleh dipertimbangkan dengan persetujuan owner dan test penuh; default: hindari.

### F-02 — `nodemailer` 7.x/8.x: banyak advisory (TIDAK DIPASANG)

OSV pada `nodemailer@7.0.11` mengembalikan **20 advisory**. Contoh yang relevan:

| ID | Ringkasan | Fixed |
|---|---|---|
| `GHSA-4g23-2xm8-66gc` | Quadratic SMTP reply parsing → DoS pra-auth | 10.0.10 |
| `GHSA-8vvx-rff5-p5rq` | Nested recipient arrays → stack exhaustion DoS | 10.0.2 |
| `GHSA-c7w3-x93f-qmm8` | SMTP command injection via `envelope.size` | 8.0.4 |
| `GHSA-8c8m-p3m8-cjg8` | (lihat OSV; fixed di 8.x/10.x) | bervariasi |

- `next-auth@4` peer opsional meminta `nodemailer ^7.0.7`.
- `next-auth@5` beta peer meminta `^7.0.7 || ^8.0.5`.
- Versi yang benar-benar bersih pada pemeriksaan adalah **10.6.1**, di luar peer Auth.js v4/v5.
- Memaksa 10.x lewat override berada di luar kombinasi yang didukung dan tidak dilakukan.

Keputusan:

- **Tidak memasang `nodemailer` sama sekali.**
- Custom email provider hanya mengimplementasikan `sendVerificationRequest`.
- Development/test memakai Mailpit via SMTP lokal dengan writer kecil (`node:net`), tanpa dependency email pihak ketiga.
- Produksi **gagal tertutup** sampai owner menyetujui provider email resmi.
- Gate: `npm ls nodemailer` harus kosong.

### F-03 — `pdf-lib@1.17.1`: maintenance risk

- OSV direct: CLEAN.
- Rilis terakhir: **2022-05-12** (lebih dari 4 tahun pada tanggal audit).
- Tidak ada advisory yang diketahui, tetapi proyek tidak aktif.

Mitigasi:

- Hanya dipakai **client-side** untuk membuat PDF dari teks yang kita kontrol.
- Tidak mem-parsing PDF dari pengguna/eksternal.
- Tidak menerima upload.
- Pin eksak; pantau advisory.
- Jika ada CVE atau kebutuhan baru: evaluasi alternatif (mis. `pdfkit`/`jsPDF`) dengan ADR, test, dan audit.

Residual risk: bug rendering/performa, bukan permukaan serangan utama.

### F-04 — Prisma CLI `latest` menunjuk RC

Saat audit:

```text
prisma dist-tags.latest = 8.0.0-rc.35
@prisma/client dist-tags.latest = 7.10.1
```

Artinya:

- `npm install prisma` tanpa versi akan memasang **release candidate**.
- Wajib pin `prisma@7.10.1` dan `@prisma/client@7.10.1`.
- Jangan memakai `npm update` buta atau `latest` di CI.

### F-05 — `next-auth@4.24.15` maintenance mode

- v4 adalah jalur stabil; v5 masih `beta.32`.
- v4 tidak lagi menerima fitur besar, tetapi masih dipakai dan kompatibel dengan Next 16.
- Risiko: patch keamanan v4 ke depan mungkin terbatas.
- Mitigasi: pantau advisory; siap migrasi ke Auth.js v5 **stabil** dengan test penuh; jangan memakai beta.

### F-06 — TypeScript 5.9.3, bukan 7.0.2

- `eslint-config-next@16.4.6` membawa `typescript-eslint@^8.56`, yang memiliki peer `typescript >=4.8.4 <6.0.0`.
- Prisma 7 merekomendasikan TypeScript 5.9.x.
- TypeScript 7.0.2 adalah stable terbaru, tetapi akan memecahkan peer lint saat ini.
- Keputusan: TS 5.9.3; evaluasi TS 6/7 setelah typescript-eslint mendukung.

### F-07 — Next.js 16 / Turbopack / proxy

- Next 16.4.6 direct OSV: CLEAN.
- Perubahan besar: Turbopack default, async request APIs, `middleware` → `proxy`, `next lint` dihapus, caching API berubah.
- Mitigasi: gunakan pola Next 16; lint via ESLint CLI; `proxy.ts`; test build/E2E.
- Jika terjadi inkompatibilitas kritis, fallback ke versi stabil sebelumnya memerlukan persetujuan owner dan audit ulang.

### F-08 — Prisma 7 driver adapter dan SSL

- Prisma 7 memakai `node-pg`; default SSL certificate validation berubah.
- Jangan menyalin workaround `ssl: { rejectUnauthorized: false }` ke produksi.
- Lokal: tanpa TLS pada loopback.
- Produksi: TLS + CA yang benar; dokumentasikan.

### F-09 — Docker image

| Image | Pin | Catatan |
|---|---|---|
| PostgreSQL | `postgres:18.6-alpine@sha256:9ba53c7d...` | Tag + digest index |
| Mailpit | `axllent/mailpit:v1.34.0@sha256:23a2ef85...` | Tag + digest index |

- Digest membuat image immutable.
- Scan Trivy/OSV image **belum dijalankan** → `NOT_VERIFIED`.
- Jangan memakai tag `latest`.
- Mailpit hanya untuk lokal/test; jangan diekspos ke publik.

### F-10 — Transitive dependency

- Lockfile sudah dibuat dan di-commit.
- `npm audit --audit-level=high` dijalankan 2026-11-23: **0 vulnerabilities** setelah override `effect@3.22.1`.
- OSV-Scanner penuh dan Trivy image masih `NOT_VERIFIED`.
- Jangan menganggap `npm audit` kosong sebagai bukti seluruh supply chain bersih.

### F-11 — `effect@3.20.0` transitive: High ReDoS (DIMITIGASI)

- Advisory: `GHSA-7589-6fvf-x4pw` — ReDoS pada `Schema.TemplateLiteral` compiled regex.
- Range terdampak: `effect <= 3.22.0`; fixed: `3.22.1`.
- Jalur:
  - `prisma@7.10.1` → `@prisma/config@7.10.1` → `effect@3.20.0` (pin eksak).
  - `@hookform/resolvers@7.0.8` → `effect` (transitive).
- Dampak: dev tooling/CLI dan validasi form; bukan jalur input pengguna langsung ke regex template Effect. Namun `npm audit` tetap gagal sebelum mitigasi.
- Mitigasi: `overrides: { "effect": "3.22.1" }` di `package.json`.
- Verifikasi setelah override:
  - `npm ls effect` → 3.22.1 (overridden/deduped).
  - `npm audit --audit-level=high` → 0 vulnerabilities.
  - `prisma generate`, `prisma migrate status`, seed, unit/component/integration test, dan `next build` lulus.
- Residual risk: Prisma mem-pin 3.20.0; override berada dalam major 3 yang sama. Pantau rilis Prisma berikutnya dan hapus override setelah Prisma memakai versi >=3.22.1.

---

## 6. Dependency yang sengaja tidak dipakai

| Paket | Alasan |
|---|---|
| `@auth/core@0.34.3` | Critical/High advisory; tidak diperlukan runtime v4 |
| `next-auth@5.0.0-beta.*` | Beta; kebijakan versi stabil |
| `nodemailer` 7/8 | Banyak advisory; versi aman di luar peer |
| `nodemailer` 10.x | Tidak kompatibel dengan peer Auth.js v4/v5 saat ini |
| Redis / BullMQ | Infrastruktur tambahan tanpa kebutuhan MVP |
| Elasticsearch / Meilisearch | Search PostgreSQL cukup |
| Sentry / Bugsnag | SaaS/biaya; belum disetujui |
| Analytics pihak ketiga | Privasi dan biaya |
| `@prisma/extension-accelerate` | Layanan berbayar/tidak diperlukan |
| `pdfkit`/`jspdf` (saat ini) | `pdf-lib` sudah disetujui; evaluasi hanya jika perlu |
| ORM/DB tambahan | Satu PostgreSQL cukup |

---

## 7. Gate audit

### 7.1 Sebelum instalasi

- [ ] Semua versi eksak; tidak ada `latest`, `^`, `~`, `*`.
- [ ] `prisma` dan `@prisma/client` sama-sama 7.10.1.
- [ ] `@auth/core` dan `nodemailer` tidak ada di `dependencies`/`devDependencies`.
- [ ] Package sumber resmi npm; maintainer jelas.
- [ ] Lisensi sesuai (MIT/ISC/Apache/BSD/MPL dev-only).
- [ ] `.npmrc` tidak menonaktifkan audit/SSL.

### 7.2 Setelah instalasi

```bash
npm ci
npm ls @auth/core
npm ls nodemailer
npm audit --audit-level=high
npm audit --json > artifacts/npm-audit.json
npx osv-scanner --lockfile=package-lock.json
npm run db:generate
npm run lint
npm run typecheck
npm run test
npm run build
```

Gate:

- [ ] `npm ls @auth/core` kosong.
- [ ] `npm ls nodemailer` kosong.
- [ ] `npm audit --audit-level=high` tidak menemukan Critical/High relevan.
- [ ] OSV-Scanner selesai; jika gagal/offline → `NOT_VERIFIED`.
- [ ] Semua test/build lulus.
- [ ] Hasil ditempel ke laporan fase.

### 7.3 Sebelum release/pilot

```bash
npm ci
npm audit --audit-level=high
npx osv-scanner --lockfile=package-lock.json
docker build -t urusin:local .
npx trivy image --severity HIGH,CRITICAL urusin:local
npx trivy image --severity HIGH,CRITICAL postgres:18.6-alpine
```

- [ ] Image app dan base image dipindai.
- [ ] Tidak ada Critical/High yang belum dimitigasi.
- [ ] Backup/restore test lulus.
- [ ] `docs/DEPENDENCY_SECURITY.md` diperbarui.
- [ ] Residual risk disetujui owner.

---

## 8. Triage severity

| Severity | Tindakan |
|---|---|
| Critical | Blokir release. Ganti/hapus dependency, patch, atau mitigasi teruji. Eskalasi owner jika tidak ada patch. |
| High | Blokir release jika exploitable/relevan. Triage exposure; patch atau mitigasi. Catat residual risk. |
| Moderate | Jadwalkan perbaikan; evaluasi exploitability. Jangan abaikan otomatis. |
| Low | Catat; perbaiki pada siklus berikutnya. |

Faktor relevansi:

- Apakah kode rentan benar-benar dipanggil?
- Apakah input penyerang dapat mencapai kode tersebut?
- Apakah aplikasi terekspos jaringan atau hanya loopback?
- Apakah ada data sensitif yang dapat terdampak?
- Apakah ada kontrol kompensasi (CSP, rate limit, isolasi)?

---

## 9. Prosedur update/patch

1. Patch/minor dalam rentang yang didukung: boleh setelah review changelog + test regresi.
2. Major upgrade: ADR, evaluasi breaking change, test penuh, persetujuan owner.
3. Jangan mengubah lockfile manual.
4. Jangan menghapus/menonaktifkan audit, SSL, auth, atau lint untuk "menghilangkan error".
5. Jika patch belum tersedia:
   - hilangkan dependency,
   - ganti dependency,
   - mitigasi teruji,
   - atau minta keputusan owner dengan residual risk tertulis.
6. Setelah setiap perubahan dependency, jalankan gate §7.2 dan perbarui dokumen ini.

---

## 10. Log pemeriksaan

| Tanggal | Alat | Cakupan | Hasil | Keterbatasan |
|---|---|---|---|---|
| 2026-11-23 | npm registry | dist-tags, peer deps, tarball `next-auth`, `@next-auth/prisma-adapter`, `@prisma/client` | Versi dipetakan; optional peer dikonfirmasi | Tidak menjalankan kode |
| 2026-11-23 | OSV API querybatch | Direct runtime/dev pins | Semua CLEAN kecuali `@auth/core` dan `nodemailer` (tidak dipakai) | Tidak mencakup transitive |
| 2026-11-23 | OSV API vulns | `@auth/core` 0.34.3, `nodemailer` 7.0.11 | Detail advisory dan fixed version | Tidak menilai exploitability aplikasi |
| 2026-11-23 | Dokumentasi Next.js 16 | Breaking changes | Dipetakan ke rencana | Dokumentasi dapat berubah |
| 2026-11-23 | Dokumentasi Prisma 7 | Upgrade/breaking changes | Dipetakan ke rencana | Belum diuji pada kode |
| 2026-11-23 | Docker Hub API | Tag/digest PostgreSQL 18.6-alpine, Mailpit v1.34.0 | Tag tersedia | Image belum dipindai |
| 2026-11-23 | `npm install --include=dev` | Lockfile + dependency tree | Terpasang; dev dependency memerlukan `--include=dev` karena host `omit=dev` | — |
| 2026-11-23 | `npm audit --audit-level=high` | Runtime + dev | **PASS, 0 vulnerabilities** setelah override `effect@3.22.1` | Audit berubah seiring waktu; ulangi saat release |
| 2026-11-23 | Prisma CLI | generate, migrate status, seed | Lulus dengan override effect | Tidak menguji semua fitur Prisma |
| 2026-11-23 | `npm audit --audit-level=high` (Phase 2) | Runtime + dev | **PASS, 0 vulnerabilities**; tidak ada dependency baru | Audit berubah seiring waktu |
| — | OSV-Scanner penuh | — | **NOT_VERIFIED** | Belum dijalankan |
| — | Trivy | — | **NOT_VERIFIED** | Image belum dibangun |

---

## 11. Residual risk register

| ID | Risiko | Severity | Mitigasi | Status |
|---|---|---|---|---|
| RR-01 | `pdf-lib` tidak aktif dipelihara | Medium | Client-only, no external PDF parsing, pin, monitor | Terbuka |
| RR-02 | Auth.js v4 maintenance mode | Medium | Pantau advisory; siap migrasi v5 stabil | Terbuka |
| RR-03 | `@auth/core`/`nodemailer` bisa masuk via transitive | High | Gate `npm ls`; review lockfile; blokir jika muncul | Terkendali |
| RR-04 | Transitive CVE belum seluruhnya dipindai | Tinggi (ketidakpastian) | `npm audit` 0; OSV-Scanner penuh belum | Sebagian terverifikasi |
| RR-05 | Docker base image CVE | Tinggi (ketidakpastian) | Trivy; digest pin; update berkala | NOT_VERIFIED |
| RR-06 | Rate limit in-memory tidak multi-instance | Medium | Single-instance MVP; upgrade sebelum scale-out | Terbuka |
| RR-07 | Email produksi belum ada | High (operasional) | Fail closed; keputusan owner | Terbuka |
| RR-08 | CSP `style-src 'unsafe-inline'` | Low/Medium | Batasi script nonce; review inline style | Terbuka |
| RR-09 | TypeScript 5.9.3 tertinggal dari 7.x | Low | Upgrade setelah typescript-eslint mendukung | Terbuka |
| RR-10 | Next 16/Prisma 7 relatif baru | Medium | Pin, test gate, fallback dengan persetujuan | Terkendali |

---

## 12. Pernyataan status

Pada 2026-11-23:

- Tidak ada klaim bahwa dependency tree sepenuhnya bebas CVE.
- Pemeriksaan direct package menunjukkan tidak ada Critical/High pada paket yang dipasang, **kecuali** paket yang sengaja tidak dipakai (`@auth/core`, `nodemailer`).
- `npm audit --audit-level=high` sudah dijalankan dan menghasilkan **0 vulnerabilities** setelah override `effect@3.22.1`.
- OSV-Scanner penuh dan image scan **belum dijalankan**; statusnya `NOT_VERIFIED`.
- Status Phase 1 untuk dependency npm: **PASS dengan residual risk yang dicatat**; bukan jaminan bebas CVE.
