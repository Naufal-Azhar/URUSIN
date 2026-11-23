import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { resetRateLimitsForTests } from "@/lib/rate-limit";
import { submitReport } from "@/modules/reports/service";
import { createTestPrisma, resetDatabase } from "../helpers/db";
import {
  createAdmin,
  createCategory,
  createPublishedVersion,
  createService,
  createUser,
} from "../helpers/factories";

const testPrisma = createTestPrisma();

async function seedService() {
  const category = await createCategory(testPrisma, "ktp");
  const admin = await createAdmin(testPrisma);
  const service = await createService(testPrisma, {
    categoryId: category.id,
    code: "KTP-02",
    slug: "ktp-el-hilang",
    title: "Penggantian KTP-el hilang",
  });
  await createPublishedVersion(testPrisma, {
    serviceId: service.id,
    adminId: admin.id,
  });
  return service;
}

describe("laporan konten", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
    resetRateLimitsForTests();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await testPrisma.$disconnect();
  });

  it("menyimpan laporan guest tanpa reporter", async () => {
    const service = await seedService();

    const result = await submitReport({
      serviceId: service.id,
      issueType: "OUTDATED_INFO",
      message: "Tautan fixture ini perlu diperiksa kembali oleh admin kurasi.",
      reporterId: null,
      ip: "198.51.100.10",
    });

    expect(result.ok).toBe(true);
    const report = await testPrisma.contentReport.findFirst();
    expect(report?.reporterId).toBeNull();
    expect(report?.issueType).toBe("OUTDATED_INFO");
  });

  it("menyimpan reporter untuk pengguna login", async () => {
    const service = await seedService();
    const user = await createUser(testPrisma, "reporter@example.test");

    const result = await submitReport({
      serviceId: service.id,
      issueType: "BROKEN_LINK",
      message: "Tautan fixture ini tidak dapat dibuka saat pengujian.",
      reporterId: user.id,
      ip: "198.51.100.11",
    });

    expect(result.ok).toBe(true);
    const report = await testPrisma.contentReport.findFirst();
    expect(report?.reporterId).toBe(user.id);
  });

  it("menolak pesan yang mengandung 16 digit", async () => {
    const service = await seedService();

    const result = await submitReport({
      serviceId: service.id,
      issueType: "OTHER",
      message: "NIK saya 2171010101010001 mohon diperbaiki data layanannya.",
      reporterId: null,
      ip: "198.51.100.12",
    });

    expect(result.ok).toBe(false);
    expect(await testPrisma.contentReport.count()).toBe(0);
  });

  it("menerapkan rate limit per IP", async () => {
    const service = await seedService();

    for (let index = 0; index < 10; index += 1) {
      const result = await submitReport({
        serviceId: service.id,
        issueType: "OTHER",
        message: `Laporan fixture nomor ${index} untuk pengujian rate limit.`,
        reporterId: null,
        ip: "198.51.100.13",
      });
      expect(result.ok).toBe(true);
    }

    const blocked = await submitReport({
      serviceId: service.id,
      issueType: "OTHER",
      message: "Laporan fixture yang seharusnya ditolak oleh rate limit.",
      reporterId: null,
      ip: "198.51.100.13",
    });

    expect(blocked.ok).toBe(false);
    expect(await testPrisma.contentReport.count()).toBe(10);
  });
});
