import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "@/lib/rate-limit";

describe("rate limit in-memory", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("mengizinkan sampai batas lalu menolak", () => {
    expect(checkRateLimit("key", 2, 1_000, 0).allowed).toBe(true);
    expect(checkRateLimit("key", 2, 1_000, 1).allowed).toBe(true);
    const blocked = checkRateLimit("key", 2, 1_000, 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("mengatur ulang setelah window berakhir", () => {
    expect(checkRateLimit("key", 1, 1_000, 0).allowed).toBe(true);
    expect(checkRateLimit("key", 1, 1_000, 500).allowed).toBe(false);
    expect(checkRateLimit("key", 1, 1_000, 1_000).allowed).toBe(true);
  });

  it("memisahkan bucket per key", () => {
    expect(checkRateLimit("a", 1, 1_000, 0).allowed).toBe(true);
    expect(checkRateLimit("b", 1, 1_000, 0).allowed).toBe(true);
    expect(checkRateLimit("a", 1, 1_000, 10).allowed).toBe(false);
  });
});
