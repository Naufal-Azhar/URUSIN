import "server-only";
import { prisma } from "@/lib/db";
import { officialDomainAllowlist } from "@/lib/env";
import { isAllowedOfficialUrl } from "@/lib/security";
import { publishedVersionWhere } from "@/modules/catalog/queries";
import type {
  CaseDetail,
  CaseRequirement,
  CaseStep,
  CaseSummary,
  StepStatus,
  StaleVersion,
} from "./types";

type LatestVersion = {
  id: string;
  serviceId: string;
  versionNumber: number;
  slug: string;
};

async function latestPublishedByServiceIds(serviceIds: string[]) {
  if (serviceIds.length === 0) return new Map<string, LatestVersion>();

  const versions = await prisma.serviceVersion.findMany({
    where: {
      serviceId: { in: serviceIds },
      ...publishedVersionWhere,
    },
    select: {
      id: true,
      serviceId: true,
      versionNumber: true,
      service: { select: { slug: true } },
    },
    orderBy: [{ serviceId: "asc" }, { publishedAt: "desc" }, { versionNumber: "desc" }],
  });

  const map = new Map<string, LatestVersion>();
  for (const version of versions) {
    if (!map.has(version.serviceId)) {
      map.set(version.serviceId, {
        id: version.id,
        serviceId: version.serviceId,
        versionNumber: version.versionNumber,
        slug: version.service.slug,
      });
    }
  }
  return map;
}

function staleVersionFor(
  serviceVersionId: string,
  latest: LatestVersion | undefined,
): StaleVersion | null {
  if (!latest || latest.id === serviceVersionId) return null;
  return { versionNumber: latest.versionNumber, slug: latest.slug };
}

function nextActionFor(
  requirements: Array<{ id: string; title: string; isRequired: boolean }>,
  readyIds: Set<string>,
  steps: Array<{ id: string; title: string }>,
  stepStatuses: Map<string, StepStatus>,
) {
  const pendingRequirement = requirements.find((requirement) => !readyIds.has(requirement.id));

  if (pendingRequirement) {
    return pendingRequirement.isRequired
      ? `Siapkan: ${pendingRequirement.title}`
      : `Periksa jika berlaku: ${pendingRequirement.title}`;
  }

  const pendingStep = steps.find((step) => stepStatuses.get(step.id) !== "USER_MARKED_DONE");

  if (pendingStep) {
    const status = stepStatuses.get(pendingStep.id) ?? "NOT_STARTED";
    return status === "IN_PROGRESS"
      ? `Lanjutkan langkah: ${pendingStep.title}`
      : `Mulai langkah: ${pendingStep.title}`;
  }

  if (requirements.length === 0 && steps.length === 0) {
    return "Buka panduan untuk melihat persiapan.";
  }

  return "Semua item ditandai selesai. Lanjutkan ke kanal resmi.";
}

export async function listUserCases(userId: string): Promise<CaseSummary[]> {
  const cases = await prisma.serviceCase.findMany({
    where: { userId, deletedAt: null },
    include: {
      serviceVersion: {
        include: {
          service: { include: { category: true } },
          requirements: {
            select: { id: true, title: true, sortOrder: true, isRequired: true },
            orderBy: { sortOrder: "asc" },
          },
          steps: {
            select: { id: true, title: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      requirementProgress: {
        select: { requirementId: true, isReady: true },
      },
      stepProgress: {
        select: { workflowStepId: true, status: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const latest = await latestPublishedByServiceIds(
    Array.from(new Set(cases.map((serviceCase) => serviceCase.serviceVersion.serviceId))),
  );

  return cases.map((serviceCase) => {
    const readyIds = new Set(
      serviceCase.requirementProgress
        .filter((progress) => progress.isReady)
        .map((progress) => progress.requirementId),
    );
    const stepStatuses = new Map<string, StepStatus>(
      serviceCase.stepProgress.map((progress) => [progress.workflowStepId, progress.status]),
    );

    const version = serviceCase.serviceVersion;
    const service = version.service;

    return {
      id: serviceCase.id,
      status: serviceCase.status,
      startedAt: serviceCase.startedAt,
      service: {
        slug: service.slug,
        title: service.title,
        categoryName: service.category.name,
      },
      versionNumber: version.versionNumber,
      verifiedAt: version.verifiedAt ?? new Date(0),
      requirementTotal: version.requirements.length,
      requirementReady: readyIds.size,
      stepTotal: version.steps.length,
      stepDone: serviceCase.stepProgress.filter(
        (progress) => progress.status === "USER_MARKED_DONE",
      ).length,
      nextAction: nextActionFor(version.requirements, readyIds, version.steps, stepStatuses),
      staleVersion: staleVersionFor(serviceCase.serviceVersionId, latest.get(version.serviceId)),
    };
  });
}

export async function getOwnedCaseDetail(
  caseId: string,
  userId: string,
): Promise<CaseDetail | null> {
  const serviceCase = await prisma.serviceCase.findFirst({
    where: { id: caseId, userId, deletedAt: null },
    include: {
      serviceVersion: {
        include: {
          service: { include: { category: true } },
          requirements: { orderBy: { sortOrder: "asc" } },
          steps: { orderBy: { sortOrder: "asc" } },
          handoffs: true,
        },
      },
      requirementProgress: true,
      stepProgress: true,
    },
  });

  if (!serviceCase) return null;

  const version = serviceCase.serviceVersion;
  const service = version.service;

  const latest = await prisma.serviceVersion.findFirst({
    where: {
      serviceId: version.serviceId,
      ...publishedVersionWhere,
    },
    select: {
      id: true,
      serviceId: true,
      versionNumber: true,
      service: { select: { slug: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { versionNumber: "desc" }],
  });

  const readyIds = new Set(
    serviceCase.requirementProgress
      .filter((progress) => progress.isReady)
      .map((progress) => progress.requirementId),
  );
  const stepStatuses = new Map<string, StepStatus>(
    serviceCase.stepProgress.map((progress) => [progress.workflowStepId, progress.status]),
  );

  const requirements: CaseRequirement[] = version.requirements.map((requirement) => ({
    id: requirement.id,
    title: requirement.title,
    guidance: requirement.guidance,
    conditionNote: requirement.conditionNote,
    isRequired: requirement.isRequired,
    sortOrder: requirement.sortOrder,
    isReady: readyIds.has(requirement.id),
  }));

  const steps: CaseStep[] = version.steps.map((step) => ({
    id: step.id,
    title: step.title,
    guidance: step.guidance,
    stepKind: step.stepKind,
    sortOrder: step.sortOrder,
    status: stepStatuses.get(step.id) ?? "NOT_STARTED",
  }));

  const handoffs = version.handoffs
    .filter((handoff) => isAllowedOfficialUrl(handoff.officialUrl, officialDomainAllowlist))
    .map((handoff) => ({
      id: handoff.id,
      label: handoff.label,
      officialUrl: handoff.officialUrl,
      channelType: handoff.channelType,
      caveat: handoff.caveat,
    }));

  return {
    id: serviceCase.id,
    status: serviceCase.status,
    startedAt: serviceCase.startedAt,
    service: {
      slug: service.slug,
      title: service.title,
      categoryName: service.category.name,
    },
    versionNumber: version.versionNumber,
    verifiedAt: version.verifiedAt ?? new Date(0),
    serviceVersionId: version.id,
    summary: version.summary,
    eligibilityNote: version.eligibilityNote,
    requirements,
    steps,
    handoffs,
    requirementTotal: requirements.length,
    requirementReady: requirements.filter((requirement) => requirement.isReady).length,
    stepTotal: steps.length,
    stepDone: steps.filter((step) => step.status === "USER_MARKED_DONE").length,
    nextAction: nextActionFor(requirements, readyIds, steps, stepStatuses),
    staleVersion: staleVersionFor(
      version.id,
      latest
        ? {
            id: latest.id,
            serviceId: latest.serviceId,
            versionNumber: latest.versionNumber,
            slug: latest.service.slug,
          }
        : undefined,
    ),
  };
}
