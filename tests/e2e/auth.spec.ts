import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { signInWithMagicLink } from "./helpers";

async function promoteToAdmin(email: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL tidak tersedia untuk E2E.");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`UPDATE "User" SET role = 'ADMIN', deleted_at = NULL WHERE email = $1`, [
      email,
    ]);
  } finally {
    await client.end();
  }
}

test("guest diarahkan ke halaman masuk saat membuka dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/masuk\?callbackUrl=/);
  await expect(page.getByRole("heading", { name: "Masuk ke URUSIN" })).toBeVisible();
});

test("warga dapat masuk melalui magic link Mailpit", async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.test`;

  await signInWithMagicLink(page, request, email);
  await expect(page.getByRole("heading", { name: /Halo,/ })).toBeVisible();
  await expect(page.getByText("Masuk sebagai Warga.")).toBeVisible();

  const sessionCookie = (await page.context().cookies()).find((cookie) =>
    cookie.name.includes("session-token"),
  );
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");
});

test("logout mengakhiri sesi", async ({ page, request }) => {
  const email = `logout-e2e-${Date.now()}@example.test`;

  await signInWithMagicLink(page, request, email);
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/masuk\?callbackUrl=/);
});

test("warga ditolak dari admin; admin dapat membuka setelah promosi", async ({ page, request }) => {
  const email = `admin-e2e-${Date.now()}@example.test`;

  await signInWithMagicLink(page, request, email);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();

  await promoteToAdmin(email);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Ringkasan admin" })).toBeVisible();
});

test("halaman masuk menolak email tidak valid", async ({ page }) => {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill("bukan-email");
  await page.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await expect(page.getByText("Format email tidak valid.")).toBeVisible();
});
