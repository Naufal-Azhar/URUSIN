import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestPrisma, resetDatabase } from "../helpers/db";
import { createCategory, createService, createUser, createVersion } from "../helpers/factories";

const prisma = createTestPrisma();

describe("constraint database", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("menolak email duplikat tanpa memandang huruf besar/kecil", async () => {
    await createUser(prisma, "budi@example.test");

    await expect(createUser(prisma, "BUDI@example.test")).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("menolak lebih dari satu versi PUBLISHED per service", async () => {
    const category = await createCategory(prisma);
    const service = await createService(prisma, { categoryId: category.id });

    await createVersion(prisma, {
      serviceId: service.id,
      versionNumber: 1,
      status: "PUBLISHED",
    });

    await expect(
      createVersion(prisma, {
        serviceId: service.id,
        versionNumber: 2,
        status: "PUBLISHED",
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("menolak alias duplikat setelah lowercase", async () => {
    const category = await createCategory(prisma);
    const service = await createService(prisma, { categoryId: category.id });

    await prisma.serviceAlias.create({
      data: { serviceId: service.id, phrase: "KTP Hilang" },
    });

    await expect(
      prisma.serviceAlias.create({
        data: { serviceId: service.id, phrase: "ktp hilang" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("menghapus case dan progress saat user dihapus", async () => {
    const user = await createUser(prisma);
    const category = await createCategory(prisma);
    const service = await createService(prisma, { categoryId: category.id });
    const version = await createVersion(prisma, { serviceId: service.id });
    const requirement = await prisma.requirement.create({
      data: {
        serviceVersionId: version.id,
        title: "Dokumen uji",
        guidance: "Fixture test",
        sortOrder: 1,
      },
    });
    const serviceCase = await prisma.serviceCase.create({
      data: { userId: user.id, serviceVersionId: version.id },
    });
    await prisma.requirementProgress.create({
      data: { caseId: serviceCase.id, requirementId: requirement.id, isReady: true },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.serviceCase.count()).toBe(0);
    expect(await prisma.requirementProgress.count()).toBe(0);
  });

  it("mempertahankan laporan tetapi menghapus reporter saat user dihapus", async () => {
    const user = await createUser(prisma);
    const category = await createCategory(prisma);
    const service = await createService(prisma, { categoryId: category.id });
    const report = await prisma.contentReport.create({
      data: {
        serviceId: service.id,
        reporterId: user.id,
        issueType: "OUTDATED_INFO",
        message: "Fixture laporan test yang aman.",
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const stored = await prisma.contentReport.findUnique({ where: { id: report.id } });
    expect(stored?.reporterId).toBeNull();
  });

  it("memiliki index FTS/trigram dan partial unique yang dibutuhkan", async () => {
    const rows = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'Service_title_idx',
          'ServiceAlias_phrase_idx',
          'Service_title_fts_idx',
          'ServiceVersion_summary_fts_idx',
          'ServiceVersion_one_published_per_service'
        )
      ORDER BY indexname
    `;

    expect(rows.map((row) => row.indexname)).toEqual([
      "ServiceAlias_phrase_idx",
      "ServiceVersion_one_published_per_service",
      "ServiceVersion_summary_fts_idx",
      "Service_title_fts_idx",
      "Service_title_idx",
    ]);
  });
});
