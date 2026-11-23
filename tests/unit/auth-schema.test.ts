import { describe, expect, it } from "vitest";
import { signInSchema } from "@/modules/auth/schemas";

describe("schema masuk", () => {
  it("menormalkan email sebelum dipakai", () => {
    const result = signInSchema.parse({
      email: "  Budi@Example.COM ",
      callbackUrl: "/dashboard",
    });

    expect(result.email).toBe("budi@example.com");
  });

  it("menormalkan homoglyph sebelum validasi dan menolak format tidak valid", () => {
    const homoglyph = signInSchema.safeParse({
      email: "budi＠example.com",
      callbackUrl: "/dashboard",
    });
    const doubleAt = signInSchema.safeParse({
      email: "budi＠example.com@evil.test",
      callbackUrl: "/dashboard",
    });
    const invalid = signInSchema.safeParse({
      email: "bukan-email",
      callbackUrl: "/dashboard",
    });

    expect(homoglyph.success).toBe(true);
    if (homoglyph.success) {
      expect(homoglyph.data.email).toBe("budi@example.com");
    }
    expect(doubleAt.success).toBe(false);
    expect(invalid.success).toBe(false);
  });

  it("menolak callback URL yang tidak aman", () => {
    const result = signInSchema.safeParse({
      email: "budi@example.com",
      callbackUrl: "//evil.example",
    });

    expect(result.success).toBe(false);
  });
});
