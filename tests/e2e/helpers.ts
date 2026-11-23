import { expect, type APIRequestContext, type Page } from "@playwright/test";

export async function waitForHydration(page: Page, selector?: string) {
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
  await page.waitForFunction(
    (target) => {
      const nextWindow = window as Window & { next?: unknown };
      if (!nextWindow.next) return false;
      if (!target) return true;

      const node = document.querySelector(target);
      if (!node) return false;

      const keys = Object.keys(node);
      return (
        keys.some((key) => key.startsWith("__reactProps$")) &&
        keys.some((key) => key.startsWith("__reactEvents$"))
      );
    },
    selector,
    { timeout: 15_000 },
  );
}

export async function latestMailLink(
  request: APIRequestContext,
  email: string,
  pathIncludes?: string,
) {
  const expectedRecipient = email.toLowerCase();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const listResponse = await request.get("http://127.0.0.1:8025/api/v1/messages");
    if (listResponse.ok()) {
      const list = (await listResponse.json()) as {
        messages?: Array<{ ID?: string; IDString?: string }>;
      };

      for (const message of list.messages?.slice(0, 20) ?? []) {
        const id = message.ID ?? message.IDString;
        if (!id) continue;

        const detailResponse = await request.get(`http://127.0.0.1:8025/api/v1/message/${id}`);
        if (!detailResponse.ok()) continue;

        const detail = (await detailResponse.json()) as {
          To?: Array<{ Address?: string }>;
          Text?: string;
          HTML?: string;
        };
        const recipients = (detail.To ?? []).map((recipient) =>
          (recipient.Address ?? "").toLowerCase(),
        );
        if (!recipients.includes(expectedRecipient)) continue;

        const content = detail.Text ?? detail.HTML ?? "";
        const match = content.match(/https?:\/\/[^\s"'<>]+/);
        if (match && (!pathIncludes || match[0].includes(pathIncludes))) return match[0];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Tautan email tidak ditemukan di Mailpit.");
}

export function latestMagicLink(request: APIRequestContext, email: string) {
  return latestMailLink(request, email, "/api/auth/callback/email");
}

export async function signInWithMagicLink(page: Page, request: APIRequestContext, email: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await expect(page).toHaveURL(/\/masuk\/cek-email/);

  const magicLink = await latestMagicLink(request, email);
  await page.goto(magicLink);
  await expect(page).toHaveURL(/\/dashboard/);
}
