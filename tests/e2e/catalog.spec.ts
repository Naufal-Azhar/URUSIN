import { expect, test } from "@playwright/test";

const demoTitle = "[CONTOH UJI] Penggantian KTP hilang";

test("katalog hanya menampilkan layanan PUBLISHED yang valid", async ({ page }) => {
  await page.goto("/layanan");

  await expect(page.getByText(demoTitle)).toBeVisible();
  await expect(page.getByText("Layanan draf tidak boleh tampil")).toHaveCount(0);
});

test("pencarian menemukan sinonim dan typo", async ({ page }) => {
  await page.goto("/layanan?q=ktp+hilang");
  await expect(page.getByText(demoTitle)).toBeVisible();

  await page.goto("/layanan?q=ktp+ilang");
  await expect(page.getByText(demoTitle)).toBeVisible();

  await page.goto("/layanan?q=zzz+tidak+ada");
  await expect(page.getByText(/Tidak ada layanan terverifikasi yang cocok/)).toBeVisible();
});

test("detail menampilkan sumber resmi dan handoff yang aman", async ({ page }) => {
  await page.goto("/layanan/contoh-ktp-hilang");

  await expect(page.getByRole("heading", { level: 1, name: /CONTOH UJI/ })).toBeVisible();

  const source = page.getByRole("link", { name: /Sumber contoh untuk pengujian/ });
  await expect(source).toHaveAttribute("href", "https://example.com/sumber-uji");

  const handoff = page.getByRole("link", { name: /Buka kanal resmi/ });
  await expect(handoff).toHaveAttribute("href", "https://example.com/kanal-uji");
  await expect(handoff).toHaveAttribute("rel", /noopener/);
});

test("laporan guest dapat dikirim dan data 16 digit ditolak", async ({ page }) => {
  await page.goto("/laporkan");

  await page.getByLabel("Layanan").selectOption({ label: demoTitle });
  await page
    .getByLabel("Keterangan")
    .fill("Tautan contoh ini perlu diperiksa kembali oleh admin kurasi.");
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText("Terima kasih. Laporan akan ditinjau")).toBeVisible();

  await page.getByLabel("Layanan").selectOption({ label: demoTitle });
  await page
    .getByLabel("Keterangan")
    .fill("NIK saya 2171010101010001 mohon diperbaiki data layanannya.");
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await expect(page.getByText(/deretan 16 digit/)).toBeVisible();
});
