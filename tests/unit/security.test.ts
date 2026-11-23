import { describe, expect, it } from "vitest";
import {
  containsNikLikeSequence,
  isAllowedOfficialUrl,
  isNormalizedAsciiEmail,
  isSafeRelativeCallbackUrl,
  normalizeEmail,
  parseHttpUrl,
  safeRedirectUrl,
} from "@/lib/security";

describe("normalisasi email", () => {
  it("menormalkan NFKC, spasi, dan huruf besar", () => {
    expect(normalizeEmail("  Budi@Example.COM ")).toBe("budi@example.com");
  });

  it("menerima email ASCII yang sudah ternormalisasi", () => {
    expect(isNormalizedAsciiEmail("budi@example.com")).toBe(true);
  });

  it("menolak email yang belum ternormalisasi atau mengandung Unicode", () => {
    expect(isNormalizedAsciiEmail("Budi@example.com")).toBe(false);
    expect(isNormalizedAsciiEmail("budi＠example.com")).toBe(false);
    expect(isNormalizedAsciiEmail("budi@example")).toBe(false);
  });
});

describe("callback URL", () => {
  it("menerima path relatif same-origin", () => {
    expect(isSafeRelativeCallbackUrl("/dashboard")).toBe(true);
    expect(isSafeRelativeCallbackUrl("/pengurusan/123?tab=checklist")).toBe(true);
  });

  it("menolak open redirect", () => {
    expect(isSafeRelativeCallbackUrl("//evil.example")).toBe(false);
    expect(isSafeRelativeCallbackUrl("https://evil.example")).toBe(false);
    expect(isSafeRelativeCallbackUrl("/%2f%2fevil.example")).toBe(false);
    expect(isSafeRelativeCallbackUrl("/\\evil.example")).toBe(false);
  });

  it("mengembalikan path untuk origin yang sama dan fallback untuk origin lain", () => {
    expect(safeRedirectUrl("http://127.0.0.1:3000/dashboard", "http://127.0.0.1:3000")).toBe(
      "/dashboard",
    );
    expect(safeRedirectUrl("https://evil.example", "http://127.0.0.1:3000")).toBe("/dashboard");
  });
});

describe("URL resmi", () => {
  it("hanya menerima http/https tanpa kredensial", () => {
    expect(parseHttpUrl("https://example.com/panduan")).not.toBeNull();
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,hello")).toBeNull();
    expect(parseHttpUrl("https://user:pass@example.com")).toBeNull();
  });

  it("menerapkan allowlist domain dan menolak host privat", () => {
    expect(isAllowedOfficialUrl("https://example.com/panduan", ["example.com"])).toBe(true);
    expect(isAllowedOfficialUrl("https://sub.example.com/panduan", ["example.com"])).toBe(true);
    expect(isAllowedOfficialUrl("https://evil.example/panduan", ["example.com"])).toBe(false);
    expect(isAllowedOfficialUrl("http://127.0.0.1/panduan", ["example.com"])).toBe(false);
  });
});

describe("deteksi data sensitif", () => {
  it("mendeteksi urutan 16 digit yang menyerupai NIK/KK", () => {
    expect(containsNikLikeSequence("NIK saya 2171010101010001")).toBe(true);
    expect(containsNikLikeSequence("Nomor 2171 0101 0101 0001")).toBe(true);
    expect(containsNikLikeSequence("Tolong perbarui tautan")).toBe(false);
  });
});
