import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { publishedVersionWhere } from "@/modules/catalog/queries";
import { caseCreateSchema, idSchema, stepStatusSchema } from "./schemas";
import type { CaseActionResult, CreateCaseResult, StepStatus } from "./types";

const NOT_FOUND = "Pengurusan tidak ditemukan.";
const ARCHIVED = "Pengurusan sudah diarsipkan.";

async function getCaseForMutation(tx: Prisma.TransactionClient, caseId: string, userId: string) {
  return tx.serviceCase.findFirst({
    where: { id: caseId, userId, deletedAt: null },
    select: { id: true, serviceVersionId: true, status: true },
  });
}

export async function createCaseForUser(input: {
  userId: string;
  slug: string;
}): Promise<CreateCaseResult> {
  const parsed = caseCreateSchema.safeParse({ slug: input.slug });
  if (!parsed.success) {
    return { ok: false, message: "Layanan tidak valid." };
  }

  const service = await prisma.service.findFirst({
    where: {
      slug: parsed.data.slug,
      lifecycleStatus: "ACTIVE",
      versions: { some: publishedVersionWhere },
    },
    select: {
      id: true,
      versions: {
        where: publishedVersionWhere,
        orderBy: [{ publishedAt: "desc" }, { versionNumber: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });

  const version = service?.versions[0];
  if (!service || !version) {
    return {
      ok: false,
      message: "Layanan belum tersedia atau belum terverifikasi.",
    };
  }

  const serviceCase = await prisma.serviceCase.create({
    data: {
      userId: input.userId,
      serviceVersionId: version.id,
    },
    select: { id: true },
  });

  return { ok: true, caseId: serviceCase.id };
}

export async function setRequirementReadyForUser(input: {
  userId: string;
  caseId: string;
  requirementId: string;
  isReady: boolean;
}): Promise<CaseActionResult> {
  if (
    !idSchema.safeParse(input.caseId).success ||
    !idSchema.safeParse(input.requirementId).success
  ) {
    return { ok: false, message: "Item tidak valid." };
  }

  return prisma.$transaction(async (tx) => {
    const serviceCase = await getCaseForMutation(tx, input.caseId, input.userId);
    if (!serviceCase) return { ok: false, message: NOT_FOUND };
    if (serviceCase.status === "ARCHIVED") return { ok: false, message: ARCHIVED };

    const requirement = await tx.requirement.findFirst({
      where: {
        id: input.requirementId,
        serviceVersionId: serviceCase.serviceVersionId,
      },
      select: { id: true },
    });

    if (!requirement) {
      return {
        ok: false,
        message: "Item tidak sesuai dengan versi pengurusan.",
      };
    }

    await tx.requirementProgress.upsert({
      where: {
        caseId_requirementId: {
          caseId: input.caseId,
          requirementId: input.requirementId,
        },
      },
      update: { isReady: input.isReady },
      create: {
        caseId: input.caseId,
        requirementId: input.requirementId,
        isReady: input.isReady,
      },
    });

    return { ok: true };
  });
}

export async function setStepStatusForUser(input: {
  userId: string;
  caseId: string;
  workflowStepId: string;
  status: StepStatus;
}): Promise<CaseActionResult> {
  if (
    !idSchema.safeParse(input.caseId).success ||
    !idSchema.safeParse(input.workflowStepId).success
  ) {
    return { ok: false, message: "Item tidak valid." };
  }
  if (!stepStatusSchema.safeParse(input.status).success) {
    return { ok: false, message: "Status langkah tidak valid." };
  }

  return prisma.$transaction(async (tx) => {
    const serviceCase = await getCaseForMutation(tx, input.caseId, input.userId);
    if (!serviceCase) return { ok: false, message: NOT_FOUND };
    if (serviceCase.status === "ARCHIVED") return { ok: false, message: ARCHIVED };

    const step = await tx.workflowStep.findFirst({
      where: {
        id: input.workflowStepId,
        serviceVersionId: serviceCase.serviceVersionId,
      },
      select: { id: true },
    });

    if (!step) {
      return {
        ok: false,
        message: "Langkah tidak sesuai dengan versi pengurusan.",
      };
    }

    await tx.stepProgress.upsert({
      where: {
        caseId_workflowStepId: {
          caseId: input.caseId,
          workflowStepId: input.workflowStepId,
        },
      },
      update: { status: input.status },
      create: {
        caseId: input.caseId,
        workflowStepId: input.workflowStepId,
        status: input.status,
      },
    });

    return { ok: true };
  });
}

export async function markCaseDoneForUser(input: {
  userId: string;
  caseId: string;
}): Promise<CaseActionResult> {
  if (!idSchema.safeParse(input.caseId).success) {
    return { ok: false, message: NOT_FOUND };
  }

  const result = await prisma.serviceCase.updateMany({
    where: {
      id: input.caseId,
      userId: input.userId,
      deletedAt: null,
      status: { not: "ARCHIVED" },
    },
    data: {
      status: "USER_MARKED_DONE",
      completedAt: new Date(),
    },
  });

  return result.count > 0 ? { ok: true } : { ok: false, message: NOT_FOUND };
}

export async function archiveCaseForUser(input: {
  userId: string;
  caseId: string;
}): Promise<CaseActionResult> {
  if (!idSchema.safeParse(input.caseId).success) {
    return { ok: false, message: NOT_FOUND };
  }

  const result = await prisma.serviceCase.updateMany({
    where: { id: input.caseId, userId: input.userId, deletedAt: null },
    data: { status: "ARCHIVED" },
  });

  return result.count > 0 ? { ok: true } : { ok: false, message: NOT_FOUND };
}

export async function deleteCaseForUser(input: {
  userId: string;
  caseId: string;
}): Promise<CaseActionResult> {
  if (!idSchema.safeParse(input.caseId).success) {
    return { ok: false, message: NOT_FOUND };
  }

  const result = await prisma.serviceCase.updateMany({
    where: { id: input.caseId, userId: input.userId, deletedAt: null },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });

  return result.count > 0 ? { ok: true } : { ok: false, message: NOT_FOUND };
}
