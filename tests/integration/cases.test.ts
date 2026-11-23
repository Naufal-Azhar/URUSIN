import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getOwnedCaseDetail, listUserCases } from "@/modules/cases/queries";
import {
  archiveCaseForUser,
  createCaseForUser,
  deleteCaseForUser,
  markCaseDoneForUser,
  setRequirementReadyForUser,
  setStepStatusForUser,
} from "@/modules/cases/service";
import { createTestPrisma, resetDatabase } from "../helpers/db";
import {
  createAdmin,
  createCategory,
  createPublishedVersion,
  createService,
  createUser,
} from "../helpers/factories";

const testPrisma = createTestPrisma();

async function seedService(options?: {
  code?: string;
  slug?: string;
  title?: string;
  categorySlug?: string;
  adminEmail?: string;
}) {
  const category = await createCategory(testPrisma, options?.categorySlug ?? "ktp");
  const admin = await createAdmin(testPrisma, options?.adminEmail ?? "admin@example.test");
  const service = await createService(testPrisma, {
    categoryId: category.id,
    code: options?.code ?? "KTP-02",
    slug: options?.slug ?? "ktp-el-hilang",
    title: options?.title ?? "Penggantian KTP-el hilang",
  });
  const version = await createPublishedVersion(testPrisma, {
    serviceId: service.id,
    adminId: admin.id,
  });
  return { category, admin, service, version };
}

describe("workspace pengurusan", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await testPrisma.$disconnect();
  });

  it("membuat case dari versi published dan menampilkan ringkasan progres", async () => {
    const { service } = await seedService();
    const user = await createUser(testPrisma, "warga@example.test");

    const result = await createCaseForUser({ userId: user.id, slug: service.slug });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cases = await listUserCases(user.id);
    expect(cases).toHaveLength(1);
    expect(cases[0]?.service.title).toBe("Penggantian KTP-el hilang");
    expect(cases[0]?.requirementTotal).toBe(1);
    expect(cases[0]?.stepTotal).toBe(1);
    expect(cases[0]?.nextAction).toContain("Dokumen uji");

    const detail = await getOwnedCaseDetail(result.caseId, user.id);
    expect(detail?.requirements[0]?.isReady).toBe(false);
    expect(detail?.steps[0]?.status).toBe("NOT_STARTED");
    expect(detail?.handoffs[0]?.officialUrl).toBe("https://example.com/kanal-uji");
  });

  it("mendukung lebih dari satu case dengan progres terpisah", async () => {
    const first = await seedService({
      code: "KTP-02",
      slug: "ktp-el-hilang",
      title: "Penggantian KTP-el hilang",
    });
    const second = await seedService({
      code: "SIM-02",
      slug: "sim-c-perpanjangan",
      title: "Perpanjangan SIM C",
      categorySlug: "sim",
      adminEmail: "admin2@example.test",
    });
    const user = await createUser(testPrisma, "multi@example.test");

    const one = await createCaseForUser({ userId: user.id, slug: first.service.slug });
    const two = await createCaseForUser({ userId: user.id, slug: second.service.slug });
    expect(one.ok && two.ok).toBe(true);

    const cases = await listUserCases(user.id);
    expect(cases).toHaveLength(2);
  });

  it("menolak akses user lain ke case (BOLA)", async () => {
    const { service } = await seedService();
    const owner = await createUser(testPrisma, "owner@example.test");
    const other = await createUser(testPrisma, "other@example.test");

    const created = await createCaseForUser({
      userId: owner.id,
      slug: service.slug,
    });
    if (!created.ok) throw new Error(created.message);

    expect(await getOwnedCaseDetail(created.caseId, other.id)).toBeNull();

    const detail = await getOwnedCaseDetail(created.caseId, owner.id);
    const requirementId = detail?.requirements[0]?.id;
    if (!requirementId) throw new Error("Requirement tidak ditemukan.");

    const result = await setRequirementReadyForUser({
      userId: other.id,
      caseId: created.caseId,
      requirementId,
      isReady: true,
    });

    expect(result.ok).toBe(false);
    expect(await testPrisma.requirementProgress.count()).toBe(0);
  });

  it("menolak item dari versi lain (tampering)", async () => {
    const { service, admin } = await seedService();
    const user = await createUser(testPrisma, "tamper@example.test");

    const created = await createCaseForUser({ userId: user.id, slug: service.slug });
    if (!created.ok) throw new Error(created.message);

    const otherVersion = await testPrisma.serviceVersion.create({
      data: {
        serviceId: service.id,
        versionNumber: 2,
        status: "ARCHIVED",
        summary: "Versi lain untuk pengujian.",
        verifiedAt: new Date(),
        verifiedById: admin.id,
        publishedAt: new Date(),
      },
    });
    const otherRequirement = await testPrisma.requirement.create({
      data: {
        serviceVersionId: otherVersion.id,
        title: "Item versi lain",
        guidance: "Tidak boleh dipakai pada case versi 1.",
        sortOrder: 1,
      },
    });
    const otherStep = await testPrisma.workflowStep.create({
      data: {
        serviceVersionId: otherVersion.id,
        title: "Langkah versi lain",
        guidance: "Tidak boleh dipakai pada case versi 1.",
        stepKind: "PREPARE",
        sortOrder: 1,
      },
    });

    const requirementResult = await setRequirementReadyForUser({
      userId: user.id,
      caseId: created.caseId,
      requirementId: otherRequirement.id,
      isReady: true,
    });
    const stepResult = await setStepStatusForUser({
      userId: user.id,
      caseId: created.caseId,
      workflowStepId: otherStep.id,
      status: "USER_MARKED_DONE",
    });

    expect(requirementResult.ok).toBe(false);
    expect(stepResult.ok).toBe(false);
    expect(await testPrisma.requirementProgress.count()).toBe(0);
    expect(await testPrisma.stepProgress.count()).toBe(0);
  });

  it("upsert progres idempotent dan menghitung next action", async () => {
    const { service } = await seedService();
    const user = await createUser(testPrisma, "progress@example.test");

    const created = await createCaseForUser({ userId: user.id, slug: service.slug });
    if (!created.ok) throw new Error(created.message);

    const detail = await getOwnedCaseDetail(created.caseId, user.id);
    const requirement = detail?.requirements[0];
    const step = detail?.steps[0];
    if (!requirement || !step) throw new Error("Item fixture tidak ditemukan.");

    expect(
      (
        await setRequirementReadyForUser({
          userId: user.id,
          caseId: created.caseId,
          requirementId: requirement.id,
          isReady: true,
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await setRequirementReadyForUser({
          userId: user.id,
          caseId: created.caseId,
          requirementId: requirement.id,
          isReady: true,
        })
      ).ok,
    ).toBe(true);
    expect(await testPrisma.requirementProgress.count()).toBe(1);

    expect(
      (
        await setStepStatusForUser({
          userId: user.id,
          caseId: created.caseId,
          workflowStepId: step.id,
          status: "USER_MARKED_DONE",
        })
      ).ok,
    ).toBe(true);

    const updated = await getOwnedCaseDetail(created.caseId, user.id);
    expect(updated?.requirementReady).toBe(1);
    expect(updated?.stepDone).toBe(1);
    expect(updated?.nextAction).toContain("Semua item ditandai selesai");
  });

  it("menampilkan version warning tanpa mengubah progres lama", async () => {
    const { service, admin, version } = await seedService();
    const user = await createUser(testPrisma, "stale@example.test");

    const created = await createCaseForUser({ userId: user.id, slug: service.slug });
    if (!created.ok) throw new Error(created.message);

    const detail = await getOwnedCaseDetail(created.caseId, user.id);
    const requirement = detail?.requirements[0];
    if (!requirement) throw new Error("Requirement tidak ditemukan.");
    await setRequirementReadyForUser({
      userId: user.id,
      caseId: created.caseId,
      requirementId: requirement.id,
      isReady: true,
    });

    await testPrisma.serviceVersion.update({
      where: { id: version.id },
      data: { status: "ARCHIVED" },
    });
    await createPublishedVersion(testPrisma, {
      serviceId: service.id,
      adminId: admin.id,
      versionNumber: 2,
    });

    const updated = await getOwnedCaseDetail(created.caseId, user.id);
    expect(updated?.staleVersion?.versionNumber).toBe(2);
    expect(updated?.requirements[0]?.isReady).toBe(true);
  });

  it("mendukung tandai selesai, arsip, dan hapus dengan ownership", async () => {
    const { service } = await seedService();
    const owner = await createUser(testPrisma, "owner2@example.test");
    const other = await createUser(testPrisma, "other2@example.test");

    const created = await createCaseForUser({ userId: owner.id, slug: service.slug });
    if (!created.ok) throw new Error(created.message);

    expect((await markCaseDoneForUser({ userId: other.id, caseId: created.caseId })).ok).toBe(
      false,
    );
    expect(
      (
        await markCaseDoneForUser({
          userId: owner.id,
          caseId: created.caseId,
        })
      ).ok,
    ).toBe(true);

    const done = await listUserCases(owner.id);
    expect(done[0]?.status).toBe("USER_MARKED_DONE");

    expect((await archiveCaseForUser({ userId: other.id, caseId: created.caseId })).ok).toBe(false);
    expect((await archiveCaseForUser({ userId: owner.id, caseId: created.caseId })).ok).toBe(true);

    const archived = await listUserCases(owner.id);
    expect(archived[0]?.status).toBe("ARCHIVED");

    expect((await deleteCaseForUser({ userId: other.id, caseId: created.caseId })).ok).toBe(false);
    expect((await deleteCaseForUser({ userId: owner.id, caseId: created.caseId })).ok).toBe(true);

    expect(await listUserCases(owner.id)).toHaveLength(0);
  });
});
