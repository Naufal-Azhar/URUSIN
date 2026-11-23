import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInWithMagicLink } from "./helpers";

test("admin membuat layanan, publish setelah lengkap, dan versi terbit terkunci", async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, "demo-admin@example.test");
  await page.goto("/admin/layanan");
  await expect(page.getByRole("heading", { name: "Layanan", level: 1 })).toBeVisible();

  const suffix = String(Date.now()).slice(-4);
  const code = `T${suffix}-01`;
  const slug = `e2e-admin-${suffix}`;
  const title = `[E2E] Layanan admin ${suffix}`;

  await page.getByLabel("Kategori").selectOption({ label: "Contoh Uji" });
  await page.getByLabel("Kode").fill(code);
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Judul").fill(title);
  await page.getByRole("button", { name: "Buat layanan" }).click();

  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText("Layanan dan versi draft berhasil dibuat.")).toBeVisible();
  await page.waitForTimeout(500);

  await page
    .getByLabel("Ringkasan prosedur")
    .fill("Ringkasan prosedur E2E yang lengkap dan layak untuk pengujian publish.");
  await page.getByRole("button", { name: "Simpan ringkasan" }).click();
  await expect(page.getByText("Perubahan berhasil disimpan.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByLabel("Judul persyaratan").fill("Dokumen E2E");
  await page.getByLabel("Panduan persyaratan").fill("Panduan persyaratan E2E.");
  await page.getByRole("button", { name: "Tambah persyaratan" }).click();
  await expect(page.getByText("Item berhasil ditambahkan.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByLabel("Judul langkah").fill("Langkah E2E");
  await page.getByLabel("Panduan langkah").fill("Panduan langkah E2E.");
  await page.getByRole("button", { name: "Tambah langkah" }).click();
  await expect(page.getByText("Item berhasil ditambahkan.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByLabel("Nama instansi").fill("Instansi E2E");
  await page.getByLabel("Judul sumber").fill("Sumber E2E");
  await page.getByLabel("URL sumber").fill("https://example.com/sumber-e2e");
  await page.getByRole("button", { name: "Tambah sumber" }).click();
  await expect(page.getByText("Sumber resmi berhasil ditautkan.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByLabel("Label kanal").fill("Kanal E2E");
  await page.getByLabel("URL kanal").fill("https://example.com/kanal-e2e");
  await page.getByRole("button", { name: "Tambah kanal" }).click();
  await expect(page.getByText("Kanal resmi berhasil ditambahkan.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Tandai terverifikasi" }).click();
  await expect(page.getByText("Versi ditandai sudah diverifikasi.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Kirim untuk review" }).click();
  await expect(page.getByText("Versi dikirim untuk review.")).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Publikasikan" }).click();
  await expect(page.getByText("Versi berhasil dipublikasikan.")).toBeVisible();

  await page.goto(`/layanan/${slug}`);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText("Sumber E2E")).toBeVisible();

  await page.goto("/admin/layanan");
  await page
    .getByRole("row", { name: new RegExp(code) })
    .getByRole("link", { name: "Kelola" })
    .click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Buka editor" }).click();
  await expect(page.getByText("tidak dapat diubah")).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan ringkasan" })).toHaveCount(0);
});

test("admin men-triase laporan guest", async ({ page, request }) => {
  await signInWithMagicLink(page, request, "demo-admin@example.test");

  const message = `Laporan E2E ${Date.now()} perlu diperiksa admin.`;
  await page.goto("/laporkan");
  await page.getByLabel("Layanan").selectOption({ label: "[CONTOH UJI] Penggantian KTP hilang" });
  await page.getByLabel("Keterangan").fill(message);
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText("Terima kasih. Laporan akan ditinjau")).toBeVisible();

  await page.goto("/admin/laporan");
  const article = page.locator("article", { hasText: message });
  await expect(article).toBeVisible();
  await article.getByLabel("Status laporan").selectOption("REVIEWING");
  await article.getByRole("button", { name: "Perbarui status" }).click();
  await expect(page.getByText("Status laporan berhasil diperbarui.")).toBeVisible();
  await expect(page.locator("article", { hasText: message })).toContainText("Sedang ditinjau");
});

test("halaman admin tidak punya pelanggaran axe serius", async ({ page, request }) => {
  await signInWithMagicLink(page, request, "demo-admin@example.test");

  for (const path of [
    "/admin",
    "/admin/layanan",
    "/admin/review",
    "/admin/laporan",
    "/admin/audit",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(
      serious,
      serious.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
  }
});
