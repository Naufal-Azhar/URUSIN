import { describe, expect, it } from "vitest";
import { buildMimeMessage, dotStuffMessage } from "@/modules/auth/email/mailpit-transport";

describe("pesan email lokal", () => {
  it("membangun header MIME tanpa header injection", () => {
    const message = buildMimeMessage({
      to: "user@example.test",
      from: "URUSIN <no-reply@urusin.test>",
      subject: "Tautan masuk URUSIN",
      text: "Halo,\n\nBuka tautan berikut.",
    });

    expect(message).toContain("To: user@example.test");
    expect(message).toContain("Subject: =?UTF-8?B?");
    expect(message).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(message).toContain("Halo,\r\n\r\nBuka tautan berikut.");
  });

  it("menolak CRLF pada header", () => {
    expect(() =>
      buildMimeMessage({
        to: "user@example.test\r\nBcc: evil@example.test",
        from: "URUSIN <no-reply@urusin.test>",
        subject: "Halo",
        text: "Isi",
      }),
    ).toThrow();
  });

  it("melakukan dot-stuffing pada baris yang diawali titik", () => {
    const stuffed = dotStuffMessage("baris\r\n.ini\r\n..itu");
    expect(stuffed).toBe("baris\r\n..ini\r\n...itu");
  });
});
