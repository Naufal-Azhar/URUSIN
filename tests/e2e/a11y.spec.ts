import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/layanan",
  "/layanan/contoh-ktp-hilang",
  "/laporkan",
  "/masuk",
  "/tentang",
  "/privasi",
];

for (const path of pages) {
  test(`tidak ada pelanggaran axe serius di ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );

    expect(
      serious,
      serious.map((violation) => `${violation.id}: ${violation.help}`).join("\n"),
    ).toEqual([]);
  });
}
