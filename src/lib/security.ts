import { z } from "zod";

export function normalizeEmail(input: string) {
  return input.normalize("NFKC").trim().toLowerCase();
}

export function isNormalizedAsciiEmail(input: string) {
  if (input !== normalizeEmail(input)) return false;
  if (!/^[\x21-\x7e]+$/.test(input)) return false;

  const parts = input.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.length > 64 || domain.length > 253) return false;
  if (!domain.includes(".")) return false;
  if (input.includes("..")) return false;

  return true;
}

export const normalizedEmailSchema = z.string().min(3).max(254).refine(isNormalizedAsciiEmail, {
  message: "Format email tidak valid.",
});

export function isSafeRelativeCallbackUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  if (value.length > 2048) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (value.includes("\n") || value.includes("\r")) return false;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || decoded.includes("\\")) return false;
  } catch {
    return false;
  }

  return true;
}

export function safeRedirectUrl(url: string, baseUrl: string) {
  try {
    const base = new URL(baseUrl);
    const target = new URL(url, base);
    if (target.origin !== base.origin) return "/dashboard";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/dashboard";
  }
}

export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host.endsWith(".localhost")) return true;
  if (/^127\./.test(host) || /^0\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^\[?fc[0-9a-f]{2}:/i.test(host) || /^\[?fd[0-9a-f]{2}:/i.test(host)) return true;
  return false;
}

export function isAllowedOfficialUrl(value: string, allowlist: string[]) {
  const url = parseHttpUrl(value);
  if (!url) return false;
  if (isPrivateHostname(url.hostname)) return false;

  const hostname = url.hostname.toLowerCase();
  return allowlist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

export function containsNikLikeSequence(value: string) {
  return /\d{16}/.test(value.replace(/[\s.-]/g, ""));
}
