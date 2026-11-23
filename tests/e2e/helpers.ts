import { expect, type APIRequestContext, type Page } from "@playwright/test";

export async function latestMagicLink(request: APIRequestContext, email: string) {
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
        if (match) return match[0];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Magic link tidak ditemukan di Mailpit.");
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
