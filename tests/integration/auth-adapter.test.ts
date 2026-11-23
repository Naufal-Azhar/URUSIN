import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/modules/auth/adapter";
import { resetDatabase } from "../helpers/db";

describe("Auth.js Prisma adapter", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("membuat user dengan email lowercase dan role CITIZEN", async () => {
    const user = await authAdapter.createUser!({
      email: "Budi@Example.TEST",
      name: "Budi",
      emailVerified: null,
      image: null,
    });

    expect(user.email).toBe("budi@example.test");
    expect((user as { role?: string }).role).toBe("CITIZEN");
  });

  it("menemukan user dengan input email yang berbeda kapitalisasi", async () => {
    await authAdapter.createUser!({
      email: "budi@example.test",
      name: "Budi",
      emailVerified: null,
      image: null,
    });

    const user = await authAdapter.getUserByEmail!("BUDI@EXAMPLE.TEST");
    expect(user?.email).toBe("budi@example.test");
  });

  it("menggunakan verification token satu kali dan menormalkan identifier", async () => {
    const expires = new Date(Date.now() + 60_000);
    await authAdapter.createVerificationToken!({
      identifier: "Budi@Example.Test",
      token: "hashed-token",
      expires,
    });

    const first = await authAdapter.useVerificationToken!({
      identifier: "budi@example.test",
      token: "hashed-token",
    });
    const second = await authAdapter.useVerificationToken!({
      identifier: "budi@example.test",
      token: "hashed-token",
    });

    expect(first?.identifier).toBe("budi@example.test");
    expect(second).toBeNull();
  });

  it("mengembalikan session beserta role user", async () => {
    const user = await authAdapter.createUser!({
      email: "admin@example.test",
      name: "Admin",
      emailVerified: null,
      image: null,
    });
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });

    await authAdapter.createSession!({
      sessionToken: "session-token-test",
      userId: user.id,
      expires: new Date(Date.now() + 60_000),
    });

    const result = await authAdapter.getSessionAndUser!("session-token-test");
    expect(result?.session.userId).toBe(user.id);
    expect((result?.user as { role?: string }).role).toBe("ADMIN");
  });
});
