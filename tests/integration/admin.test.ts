import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  addHandoffForAdmin,
  addRequirementForAdmin,
  addSourceForAdmin,
  addStepForAdmin,
  createServiceForAdmin,
  createVersionForAdmin,
  markVersionVerifiedForAdmin,
  publishVersionForAdmin,
  setReportStatusForAdmin,
  submitVersionForAdmin,
  updateVersionDraftForAdmin,
} from "@/modules/admin/service";
import { getPublishedServiceBySlug } from "@/modules/catalog/queries";
import { createTestPrisma, resetDatabase } from "../helpers/db";
import { createAdmin, createCategory, createUser } from "../helpers/factories";

const testPrisma = createTestPrisma();

async function setupAdmin() {
  const category = await createCategory(testPrisma, "ktp");
  const admin = await createAdmin(testPrisma, "admin-flow@example.test");
  return { category, admin };
}

async function createDraft(input: {
  actorId: string;
  categoryId: string;
  code?: string;
  slug?: string;
  title?: string;
}) {
  const result = await createServiceForAdmin({
    actorId: input.actorId,
    categoryId: input.categoryId,
    code: input.code ?? "TST-01",
    slug: input.slug ?? "tst-layanan",
    title: input.title ?? "Layanan Uji Admin",
  });
  if (!result.ok) throw new Error(result.error);
  return result;
}

async function completeVersion(input: { actorId: string; versionId: string; suffix: string }) {
  await updateVersionDraftForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
    summary: "Ringkasan prosedur lengkap untuk pengujian publish.",
    eligibilityNote: "Catatan kelayakan pengujian.",
  });
  await addRequirementForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
    title: `Persyaratan ${input.suffix}`,
    guidance: "Panduan persyaratan pengujian.",
    conditionNote: "",
    isRequired: true,
  });
  await addStepForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
    title: `Langkah ${input.suffix}`,
    guidance: "Panduan langkah pengujian.",
    stepKind: "PREPARE",
  });
  await addSourceForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
    agencyName: "Instansi Uji",
    title: `Sumber ${input.suffix}`,
    url: `https://example.com/sumber-${input.suffix}`,
    lastCheckedAt: new Date().toISOString(),
  });
  await addHandoffForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
    label: `Kanal ${input.suffix}`,
    officialUrl: `https://example.com/kanal-${input.suffix}`,
    channelType: "WEB",
    caveat: "Kanal contoh pengujian.",
  });
  await markVersionVerifiedForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
  });
  return submitVersionForAdmin({
    actorId: input.actorId,
    versionId: input.versionId,
  });
}

describe("admin kurasi", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await testPrisma.$disconnect();
  });

  it("membuat layanan dengan versi draft dan menambah versi baru", async () => {
    const { category, admin } = await setupAdmin();
    const created = await createDraft({
      actorId: admin.id,
      categoryId: category.id,
    });

    expect(created.versionId).toBeTruthy();
    const second = await createVersionForAdmin({
      actorId: admin.id,
      serviceId: created.serviceId,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const versions = await testPrisma.serviceVersion.findMany({
      where: { serviceId: created.serviceId },
      orderBy: { versionNumber: "asc" },
    });
    expect(versions.map((version) => version.status)).toEqual(["DRAFT", "DRAFT"]);
  });

  it("menolak publish jika versi belum lengkap", async () => {
    const { category, admin } = await setupAdmin();
    const created = await createDraft({
      actorId: admin.id,
      categoryId: category.id,
    });

    await updateVersionDraftForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
      summary: "Ringkasan prosedur yang belum lengkap untuk pengujian.",
      eligibilityNote: "",
    });
    const submitted = await submitVersionForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
    });
    expect(submitted.ok).toBe(true);

    const published = await publishVersionForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
    });
    expect(published).toEqual({ ok: false, error: "publish_incomplete" });
  });

  it("mempublikasikan versi lengkap dan mengarsipkan versi terbit lama", async () => {
    const { category, admin } = await setupAdmin();
    const created = await createDraft({
      actorId: admin.id,
      categoryId: category.id,
    });

    const submitted = await completeVersion({
      actorId: admin.id,
      versionId: created.versionId,
      suffix: "v1",
    });
    expect(submitted.ok).toBe(true);

    const firstPublish = await publishVersionForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
    });
    expect(firstPublish.ok).toBe(true);

    const publicDetail = await getPublishedServiceBySlug("tst-layanan");
    expect(publicDetail?.versionNumber).toBe(1);
    expect(
      await testPrisma.contentRevision.count({
        where: { serviceVersionId: created.versionId },
      }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      await testPrisma.auditEvent.count({
        where: { entityId: created.versionId, action: "VERSION_PUBLISH" },
      }),
    ).toBe(1);

    const second = await createVersionForAdmin({
      actorId: admin.id,
      serviceId: created.serviceId,
    });
    if (!second.ok) throw new Error(second.error);
    const secondSubmitted = await completeVersion({
      actorId: admin.id,
      versionId: second.versionId,
      suffix: "v2",
    });
    expect(secondSubmitted.ok).toBe(true);

    const secondPublish = await publishVersionForAdmin({
      actorId: admin.id,
      versionId: second.versionId,
    });
    expect(secondPublish.ok).toBe(true);

    const versions = await testPrisma.serviceVersion.findMany({
      where: { serviceId: created.serviceId },
      orderBy: { versionNumber: "asc" },
    });
    expect(versions.map((version) => version.status)).toEqual(["ARCHIVED", "PUBLISHED"]);
    expect(
      await testPrisma.serviceVersion.count({
        where: { serviceId: created.serviceId, status: "PUBLISHED" },
      }),
    ).toBe(1);
  });

  it("menolak edit konten versi yang sudah terbit", async () => {
    const { category, admin } = await setupAdmin();
    const created = await createDraft({
      actorId: admin.id,
      categoryId: category.id,
    });

    await completeVersion({
      actorId: admin.id,
      versionId: created.versionId,
      suffix: "immutable",
    });
    const published = await publishVersionForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
    });
    expect(published.ok).toBe(true);

    const update = await updateVersionDraftForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
      summary: "Perubahan yang seharusnya ditolak karena versi sudah terbit.",
      eligibilityNote: "",
    });
    const addRequirement = await addRequirementForAdmin({
      actorId: admin.id,
      versionId: created.versionId,
      title: "Item baru",
      guidance: "Tidak boleh ditambahkan.",
      conditionNote: "",
      isRequired: true,
    });

    expect(update).toEqual({ ok: false, error: "not_editable" });
    expect(addRequirement).toEqual({ ok: false, error: "not_editable" });
  });

  it("mentriase laporan dan mencatat audit tanpa PII", async () => {
    const { category, admin } = await setupAdmin();
    const user = await createUser(testPrisma, "reporter-admin@example.test");
    const service = await testPrisma.service.create({
      data: {
        categoryId: category.id,
        code: "RPT-01",
        slug: "laporan-uji",
        title: "Layanan untuk laporan",
      },
    });
    const report = await testPrisma.contentReport.create({
      data: {
        serviceId: service.id,
        reporterId: user.id,
        issueType: "OUTDATED_INFO",
        message: "Laporan fixture untuk pengujian triase admin.",
      },
    });

    const reviewing = await setReportStatusForAdmin({
      actorId: admin.id,
      reportId: report.id,
      status: "REVIEWING",
    });
    const resolved = await setReportStatusForAdmin({
      actorId: admin.id,
      reportId: report.id,
      status: "RESOLVED",
    });
    const invalid = await setReportStatusForAdmin({
      actorId: admin.id,
      reportId: report.id,
      status: "REVIEWING",
    });

    expect(reviewing.ok).toBe(true);
    expect(resolved.ok).toBe(true);
    expect(invalid).toEqual({ ok: false, error: "invalid_transition" });

    const audit = await testPrisma.auditEvent.findFirst({
      where: { entityType: "ContentReport", entityId: report.id },
    });
    expect(audit?.action).toBe("REPORT_TRIAGE");
    expect(JSON.stringify(audit)).not.toContain("reporter-admin@example.test");
  });

  it("mencatat audit admin tanpa email aktor", async () => {
    const { category, admin } = await setupAdmin();
    await createDraft({ actorId: admin.id, categoryId: category.id });

    const events = await testPrisma.auditEvent.findMany();
    expect(events.length).toBeGreaterThan(0);
    expect(JSON.stringify(events)).not.toContain("admin-flow@example.test");
    expect(JSON.stringify(events)).not.toContain("@example.test");
  });
});
