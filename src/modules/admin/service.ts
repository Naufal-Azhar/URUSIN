import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { officialDomainAllowlist } from "@/lib/env";
import { isAllowedOfficialUrl, parseHttpUrl } from "@/lib/security";
import {
  handoffCreateSchema,
  reportStatusSchema,
  requirementCreateSchema,
  serviceCreateSchema,
  sourceCreateSchema,
  stepCreateSchema,
  versionUpdateSchema,
} from "./schemas";
import type { AdminCreateResult, AdminResult, AdminVersionCreateResult } from "./types";
import type { AdminMessageCode } from "./messages";

type AuditActionName =
  | "SERVICE_CREATE"
  | "SERVICE_UPDATE"
  | "VERSION_CREATE"
  | "VERSION_UPDATE"
  | "VERSION_SUBMIT"
  | "VERSION_APPROVE"
  | "VERSION_REJECT"
  | "VERSION_PUBLISH"
  | "VERSION_ARCHIVE"
  | "REPORT_TRIAGE";

function fail(error: AdminMessageCode): AdminResult {
  return { ok: false, error };
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  actorId: string,
  entityType: string,
  entityId: string,
  action: AuditActionName,
  detail: string,
) {
  await tx.auditEvent.create({
    data: {
      actorId,
      entityType,
      entityId,
      action,
      detail: detail.slice(0, 500),
    },
  });
}

async function loadVersion(tx: Prisma.TransactionClient, versionId: string) {
  return tx.serviceVersion.findUnique({
    where: { id: versionId },
    select: { id: true, serviceId: true, status: true },
  });
}

async function requireEditableVersion(
  tx: Prisma.TransactionClient,
  versionId: string,
): Promise<
  | { ok: true; version: { id: string; serviceId: string; status: string } }
  | { ok: false; error: AdminMessageCode }
> {
  const version = await loadVersion(tx, versionId);
  if (!version) return { ok: false, error: "not_found" };
  if (version.status !== "DRAFT" && version.status !== "IN_REVIEW") {
    return { ok: false, error: "not_editable" };
  }
  return { ok: true, version };
}

function parseOptionalDate(value: string | undefined) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function createServiceForAdmin(input: {
  actorId: string;
  categoryId: string;
  code: string;
  slug: string;
  title: string;
}): Promise<AdminCreateResult> {
  const parsed = serviceCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const category = await prisma.serviceCategory.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true },
  });
  if (!category) return { ok: false, error: "not_found" };

  try {
    return await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          categoryId: parsed.data.categoryId,
          code: parsed.data.code,
          slug: parsed.data.slug,
          title: parsed.data.title,
          lifecycleStatus: "ACTIVE",
          versions: {
            create: {
              versionNumber: 1,
              status: "DRAFT",
              summary: "Draf baru. Ringkasan prosedur belum diisi oleh admin.",
            },
          },
        },
        include: { versions: { select: { id: true } } },
      });

      const versionId = service.versions[0]?.id;
      if (!versionId) return { ok: false, error: "db_error" };

      await writeAudit(
        tx,
        input.actorId,
        "Service",
        service.id,
        "SERVICE_CREATE",
        "Layanan dibuat",
      );
      await writeAudit(
        tx,
        input.actorId,
        "ServiceVersion",
        versionId,
        "VERSION_CREATE",
        "Versi draft awal dibuat",
      );

      return { ok: true, serviceId: service.id, versionId };
    });
  } catch (error) {
    if (isUniqueError(error)) return { ok: false, error: "duplicate" };
    return { ok: false, error: "db_error" };
  }
}

export async function createVersionForAdmin(input: {
  actorId: string;
  serviceId: string;
}): Promise<AdminVersionCreateResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: input.serviceId },
        select: { id: true },
      });
      if (!service) return { ok: false, error: "not_found" };

      const latest = await tx.serviceVersion.findFirst({
        where: { serviceId: input.serviceId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const version = await tx.serviceVersion.create({
        data: {
          serviceId: input.serviceId,
          versionNumber: (latest?.versionNumber ?? 0) + 1,
          status: "DRAFT",
          summary: "Draf versi baru. Ringkasan belum diisi oleh admin.",
        },
        select: { id: true },
      });

      await writeAudit(
        tx,
        input.actorId,
        "ServiceVersion",
        version.id,
        "VERSION_CREATE",
        "Versi draft baru dibuat",
      );

      return { ok: true, versionId: version.id };
    });
  } catch (error) {
    if (isUniqueError(error)) return { ok: false, error: "duplicate" };
    return { ok: false, error: "db_error" };
  }
}

export async function updateVersionDraftForAdmin(input: {
  actorId: string;
  versionId: string;
  summary: string;
  eligibilityNote: string;
}): Promise<AdminResult> {
  const parsed = versionUpdateSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");

  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    await tx.serviceVersion.update({
      where: { id: editable.version.id },
      data: {
        summary: parsed.data.summary,
        eligibilityNote: parsed.data.eligibilityNote || null,
      },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Ringkasan versi diperbarui",
    );

    return { ok: true };
  });
}

export async function addRequirementForAdmin(input: {
  actorId: string;
  versionId: string;
  title: string;
  guidance: string;
  conditionNote: string;
  isRequired: boolean;
}): Promise<AdminResult> {
  const parsed = requirementCreateSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");

  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const latest = await tx.requirement.findFirst({
      where: { serviceVersionId: editable.version.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await tx.requirement.create({
      data: {
        serviceVersionId: editable.version.id,
        title: parsed.data.title,
        guidance: parsed.data.guidance,
        conditionNote: parsed.data.conditionNote || null,
        isRequired: parsed.data.isRequired,
        sortOrder: (latest?.sortOrder ?? 0) + 1,
      },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Persyaratan ditambahkan",
    );

    return { ok: true };
  });
}

export async function deleteRequirementForAdmin(input: {
  actorId: string;
  versionId: string;
  requirementId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const requirement = await tx.requirement.findFirst({
      where: {
        id: input.requirementId,
        serviceVersionId: editable.version.id,
      },
      select: { id: true },
    });
    if (!requirement) return fail("not_found");

    await tx.requirement.delete({ where: { id: requirement.id } });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Persyaratan dihapus",
    );

    return { ok: true };
  });
}

export async function addStepForAdmin(input: {
  actorId: string;
  versionId: string;
  title: string;
  guidance: string;
  stepKind: "PREPARE" | "VISIT" | "HANDOFF" | "FOLLOWUP";
}): Promise<AdminResult> {
  const parsed = stepCreateSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");

  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const latest = await tx.workflowStep.findFirst({
      where: { serviceVersionId: editable.version.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await tx.workflowStep.create({
      data: {
        serviceVersionId: editable.version.id,
        title: parsed.data.title,
        guidance: parsed.data.guidance,
        stepKind: parsed.data.stepKind,
        sortOrder: (latest?.sortOrder ?? 0) + 1,
      },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Langkah ditambahkan",
    );

    return { ok: true };
  });
}

export async function deleteStepForAdmin(input: {
  actorId: string;
  versionId: string;
  workflowStepId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const step = await tx.workflowStep.findFirst({
      where: {
        id: input.workflowStepId,
        serviceVersionId: editable.version.id,
      },
      select: { id: true },
    });
    if (!step) return fail("not_found");

    await tx.workflowStep.delete({ where: { id: step.id } });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Langkah dihapus",
    );

    return { ok: true };
  });
}

export async function addSourceForAdmin(input: {
  actorId: string;
  versionId: string;
  agencyName: string;
  title: string;
  url: string;
  lastCheckedAt: string;
}): Promise<AdminResult> {
  const parsed = sourceCreateSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  if (!parseHttpUrl(parsed.data.url)) return fail("invalid_input");

  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const source = await tx.officialSource.create({
      data: {
        agencyName: parsed.data.agencyName,
        title: parsed.data.title,
        url: parsed.data.url,
        lastCheckedAt: parseOptionalDate(parsed.data.lastCheckedAt),
      },
    });

    await tx.versionSource.create({
      data: {
        serviceVersionId: editable.version.id,
        officialSourceId: source.id,
      },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Sumber resmi ditautkan",
    );

    return { ok: true };
  });
}

export async function removeSourceForAdmin(input: {
  actorId: string;
  versionId: string;
  officialSourceId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    try {
      await tx.versionSource.delete({
        where: {
          serviceVersionId_officialSourceId: {
            serviceVersionId: editable.version.id,
            officialSourceId: input.officialSourceId,
          },
        },
      });
    } catch {
      return fail("not_found");
    }

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Sumber resmi dilepas",
    );

    return { ok: true };
  });
}

export async function addHandoffForAdmin(input: {
  actorId: string;
  versionId: string;
  label: string;
  officialUrl: string;
  channelType: "WEB" | "PHYSICAL" | "OTHER";
  caveat: string;
}): Promise<AdminResult> {
  const parsed = handoffCreateSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  if (!isAllowedOfficialUrl(parsed.data.officialUrl, officialDomainAllowlist)) {
    return fail("invalid_input");
  }

  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    await tx.officialHandoff.create({
      data: {
        serviceVersionId: editable.version.id,
        label: parsed.data.label,
        officialUrl: parsed.data.officialUrl,
        channelType: parsed.data.channelType,
        caveat: parsed.data.caveat || null,
      },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Kanal resmi ditambahkan",
    );

    return { ok: true };
  });
}

export async function deleteHandoffForAdmin(input: {
  actorId: string;
  versionId: string;
  handoffId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    const handoff = await tx.officialHandoff.findFirst({
      where: { id: input.handoffId, serviceVersionId: editable.version.id },
      select: { id: true },
    });
    if (!handoff) return fail("not_found");

    await tx.officialHandoff.delete({ where: { id: handoff.id } });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Kanal resmi dihapus",
    );

    return { ok: true };
  });
}

export async function markVersionVerifiedForAdmin(input: {
  actorId: string;
  versionId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const editable = await requireEditableVersion(tx, input.versionId);
    if (!editable.ok) return fail(editable.error);

    await tx.serviceVersion.update({
      where: { id: editable.version.id },
      data: { verifiedAt: new Date(), verifiedById: input.actorId },
    });

    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      editable.version.id,
      "VERSION_UPDATE",
      "Versi ditandai terverifikasi",
    );

    return { ok: true };
  });
}

export async function submitVersionForAdmin(input: {
  actorId: string;
  versionId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const version = await loadVersion(tx, input.versionId);
    if (!version) return fail("not_found");
    if (version.status !== "DRAFT") return fail("invalid_transition");

    await tx.serviceVersion.update({
      where: { id: version.id },
      data: { status: "IN_REVIEW" },
    });
    await tx.contentRevision.create({
      data: {
        serviceVersionId: version.id,
        authorId: input.actorId,
        action: "SUBMIT",
        note: "Dikirim untuk review",
      },
    });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      version.id,
      "VERSION_SUBMIT",
      "Versi dikirim untuk review",
    );

    return { ok: true };
  });
}

export async function rejectVersionForAdmin(input: {
  actorId: string;
  versionId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const version = await loadVersion(tx, input.versionId);
    if (!version) return fail("not_found");
    if (version.status !== "IN_REVIEW") return fail("invalid_transition");

    await tx.serviceVersion.update({
      where: { id: version.id },
      data: { status: "DRAFT" },
    });
    await tx.contentRevision.create({
      data: {
        serviceVersionId: version.id,
        authorId: input.actorId,
        reviewerId: input.actorId,
        action: "REJECT",
        note: "Dikembalikan ke draft",
      },
    });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      version.id,
      "VERSION_REJECT",
      "Versi dikembalikan ke draft",
    );

    return { ok: true };
  });
}

export async function publishVersionForAdmin(input: {
  actorId: string;
  versionId: string;
}): Promise<AdminResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const version = await tx.serviceVersion.findUnique({
        where: { id: input.versionId },
        include: {
          handoffs: { select: { officialUrl: true } },
          _count: {
            select: {
              sources: true,
              requirements: true,
              steps: true,
              handoffs: true,
            },
          },
        },
      });

      if (!version) return fail("not_found");
      if (version.status !== "IN_REVIEW") return fail("invalid_transition");
      if (!version.verifiedAt || !version.verifiedById) {
        return fail("publish_incomplete");
      }
      if (
        version._count.sources < 1 ||
        version._count.requirements < 1 ||
        version._count.steps < 1 ||
        version._count.handoffs < 1
      ) {
        return fail("publish_incomplete");
      }
      if (
        !version.handoffs.every((handoff) =>
          isAllowedOfficialUrl(handoff.officialUrl, officialDomainAllowlist),
        )
      ) {
        return fail("publish_incomplete");
      }

      await tx.serviceVersion.updateMany({
        where: {
          serviceId: version.serviceId,
          status: "PUBLISHED",
          id: { not: version.id },
        },
        data: { status: "ARCHIVED" },
      });

      await tx.serviceVersion.update({
        where: { id: version.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      await tx.contentRevision.createMany({
        data: [
          {
            serviceVersionId: version.id,
            authorId: input.actorId,
            reviewerId: input.actorId,
            action: "APPROVE",
            note: "Disetujui untuk publikasi",
          },
          {
            serviceVersionId: version.id,
            authorId: input.actorId,
            reviewerId: input.actorId,
            action: "PUBLISH",
            note: "Dipublikasikan",
          },
        ],
      });

      await writeAudit(
        tx,
        input.actorId,
        "ServiceVersion",
        version.id,
        "VERSION_PUBLISH",
        "Versi dipublikasikan",
      );
      await writeAudit(
        tx,
        input.actorId,
        "Service",
        version.serviceId,
        "SERVICE_UPDATE",
        "Katalog layanan diperbarui melalui publish",
      );

      return { ok: true };
    });
  } catch (error) {
    if (isUniqueError(error)) return fail("publish_conflict");
    return fail("db_error");
  }
}

export async function archiveVersionForAdmin(input: {
  actorId: string;
  versionId: string;
}): Promise<AdminResult> {
  return prisma.$transaction(async (tx) => {
    const version = await loadVersion(tx, input.versionId);
    if (!version) return fail("not_found");
    if (version.status !== "PUBLISHED") return fail("invalid_transition");

    await tx.serviceVersion.update({
      where: { id: version.id },
      data: { status: "ARCHIVED" },
    });
    await tx.contentRevision.create({
      data: {
        serviceVersionId: version.id,
        authorId: input.actorId,
        reviewerId: input.actorId,
        action: "ARCHIVE",
        note: "Versi diarsipkan",
      },
    });
    await writeAudit(
      tx,
      input.actorId,
      "ServiceVersion",
      version.id,
      "VERSION_ARCHIVE",
      "Versi diarsipkan",
    );

    return { ok: true };
  });
}

const reportTransitions: Record<
  "OPEN" | "REVIEWING" | "RESOLVED" | "REJECTED",
  Array<"OPEN" | "REVIEWING" | "RESOLVED" | "REJECTED">
> = {
  OPEN: ["REVIEWING", "RESOLVED", "REJECTED"],
  REVIEWING: ["RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: [],
};

export async function setReportStatusForAdmin(input: {
  actorId: string;
  reportId: string;
  status: string;
}): Promise<AdminResult> {
  const parsed = reportStatusSchema.safeParse(input.status);
  if (!parsed.success) return fail("invalid_input");

  return prisma.$transaction(async (tx) => {
    const report = await tx.contentReport.findUnique({
      where: { id: input.reportId },
      select: { id: true, status: true },
    });
    if (!report) return fail("not_found");
    if (!reportTransitions[report.status].includes(parsed.data)) {
      return fail("invalid_transition");
    }

    await tx.contentReport.update({
      where: { id: report.id },
      data: { status: parsed.data },
    });
    await writeAudit(
      tx,
      input.actorId,
      "ContentReport",
      report.id,
      "REPORT_TRIAGE",
      `Status laporan: ${parsed.data}`,
    );

    return { ok: true };
  });
}
