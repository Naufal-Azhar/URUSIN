import "server-only";
import { env } from "@/lib/env";
import { checkRateLimit, hashRateLimitKey } from "@/lib/rate-limit";
import { isNormalizedAsciiEmail, normalizeEmail } from "@/lib/security";
import { sendLocalMail } from "./mailpit-transport";

type VerificationParams = {
  identifier: string;
  url: string;
  expires: Date;
  token: string;
};

export type MagicLinkProvider = {
  id: string;
  type: "email";
  name: string;
  from: string;
  maxAge: number;
  sendVerificationRequest: (params: VerificationParams) => Promise<void>;
};

function assertSafeVerificationUrl(url: string) {
  let parsed: URL;
  let base: URL;

  try {
    parsed = new URL(url);
    base = new URL(env.NEXTAUTH_URL);
  } catch {
    throw new Error("URL verifikasi tidak valid.");
  }

  if (parsed.origin !== base.origin) {
    throw new Error("URL verifikasi tidak berasal dari origin aplikasi.");
  }
}

function buildMessage(url: string) {
  return [
    "Halo,",
    "",
    "Gunakan tautan berikut untuk masuk ke URUSIN:",
    url,
    "",
    "Tautan ini berlaku selama 15 menit dan hanya dapat digunakan sekali.",
    "Jika Anda tidak meminta tautan ini, abaikan email ini.",
    "",
    "URUSIN membantu persiapan pengurusan administrasi. URUSIN bukan situs resmi pemerintah.",
  ].join("\n");
}

export const magicLinkProvider: MagicLinkProvider = {
  id: "email",
  type: "email",
  name: "Email",
  from: env.EMAIL_FROM,
  maxAge: 15 * 60,
  async sendVerificationRequest({ identifier, url }: VerificationParams) {
    if (!isNormalizedAsciiEmail(identifier)) {
      throw new Error("Email harus dinormalisasi sebelum permintaan tautan.");
    }

    const normalized = normalizeEmail(identifier);
    const limit = checkRateLimit(
      `magic-link:${hashRateLimitKey(normalized)}`,
      env.RATE_LIMIT_MAGIC_LINK_PER_EMAIL,
      env.RATE_LIMIT_WINDOW_MS,
    );

    if (!limit.allowed) {
      throw new Error("Terlalu banyak permintaan tautan masuk. Coba lagi nanti.");
    }

    assertSafeVerificationUrl(url);

    await sendLocalMail({
      to: normalized,
      from: env.EMAIL_FROM,
      subject: "Tautan masuk URUSIN",
      text: buildMessage(url),
    });
  },
};
