import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInWithMagicLink } from "./helpers";

test("membuat dua pengurusan, progres bertahan, arsip, dan hapus", async ({ page, request }) => {
  const email = `workspace-${Date.now()}@example.test`;
  await signInWithMagicLink(page, request, email);

  await page.goto("/layanan/contoh-ktp-hilang");
  await page.getByRole("button", { name: "Mulai pengurusan" }).click();
  await expect(page).toHaveURL(/\/pengurusan\/[0-9a-f-]+/);
  const firstCaseUrl = page.url();

  const checkbox = page.getByRole("checkbox", { name: /Dokumen identitas/ });
  const requirementRequest = page.waitForResponse(
    (response) => response.request().method() === "POST",
  );
  await checkbox.check();
  await requirementRequest;
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Dokumen identitas/ })).toBeChecked();

  const stepSelect = page.getByLabel("Status langkah [CONTOH] Siapkan dokumen");
  const stepRequest = page.waitForResponse((response) => response.request().method() === "POST");
  await stepSelect.selectOption("USER_MARKED_DONE");
  await stepRequest;
  await page.reload();
  await expect(page.getByLabel("Status langkah [CONTOH] Siapkan dokumen")).toHaveValue(
    "USER_MARKED_DONE",
  );

  await page.goto("/layanan/contoh-sim-c");
  await page.getByRole("button", { name: "Mulai pengurusan" }).click();
  await expect(page).toHaveURL(/\/pengurusan\/[0-9a-f-]+/);

  await page.goto("/dashboard");
  await expect(page.getByText("Penggantian KTP hilang")).toBeVisible();
  await expect(page.getByText("Perpanjangan SIM C")).toBeVisible();

  await page.goto(firstCaseUrl);
  await page.getByRole("button", { name: "Arsipkan" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Diarsipkan" })).toBeVisible();

  await page
    .getByRole("link", { name: /Penggantian KTP hilang/ })
    .first()
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hapus pengurusan" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Penggantian KTP hilang")).toHaveCount(0);
});

test("user lain tidak dapat membuka case milik user pertama", async ({
  page,
  request,
  browser,
}) => {
  const ownerEmail = `owner-${Date.now()}@example.test`;
  await signInWithMagicLink(page, request, ownerEmail);

  await page.goto("/layanan/contoh-ktp-hilang");
  await page.getByRole("button", { name: "Mulai pengurusan" }).click();
  await expect(page).toHaveURL(/\/pengurusan\/[0-9a-f-]+/);
  const caseUrl = page.url();

  const otherContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3000",
  });
  const otherPage = await otherContext.newPage();

  try {
    await signInWithMagicLink(otherPage, request, `other-${Date.now()}@example.test`);
    await otherPage.goto(caseUrl);
    await expect(otherPage.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
  } finally {
    await otherContext.close();
  }
});

test("dashboard dan detail pengurusan tidak punya pelanggaran axe serius", async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, `axe-workspace-${Date.now()}@example.test`);
  await page.goto("/layanan/contoh-ktp-hilang");
  await page.getByRole("button", { name: "Mulai pengurusan" }).click();
  await expect(page).toHaveURL(/\/pengurusan\/[0-9a-f-]+/);

  for (const path of ["/dashboard", new URL(page.url()).pathname]) {
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
