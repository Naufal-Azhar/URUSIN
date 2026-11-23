import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { officialDomainAllowlist } from "@/lib/env";
import { isAllowedOfficialUrl, parseHttpUrl } from "@/lib/security";
import type { CatalogDetail, CatalogItem, CatalogPage } from "./types";

const PAGE_SIZE = 12;
const MAX_CATALOG_ROWS = 100;

export const publishedVersionWhere = {
  status: "PUBLISHED",
  verifiedAt: { not: null },
  verifiedById: { not: null },
  sources: { some: {} },
  handoffs: { some: {} },
} satisfies Prisma.ServiceVersionWhereInput;

const publishedVersionOrder = [
  { publishedAt: "desc" as const },
  { versionNumber: "desc" as const },
];

function toCatalogItem(input: {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: { slug: string; name: string };
  version: {
    summary: string;
    verifiedAt: Date | null;
    versionNumber: number;
  };
}): CatalogItem {
  return {
    id: input.id,
    code: input.code,
    slug: input.slug,
    title: input.title,
    summary: input.version.summary,
    category: input.category,
    verifiedAt: input.version.verifiedAt ?? new Date(0),
    versionNumber: input.version.versionNumber,
  };
}

async function publishedServicesWithValidHandoff(category?: string) {
  const services = await prisma.service.findMany({
    where: {
      lifecycleStatus: "ACTIVE",
      ...(category ? { category: { slug: category } } : {}),
      versions: { some: publishedVersionWhere },
    },
    include: {
      category: true,
      versions: {
        where: publishedVersionWhere,
        orderBy: publishedVersionOrder,
        take: 1,
        include: {
          handoffs: true,
        },
      },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { code: "asc" }],
    take: MAX_CATALOG_ROWS,
  });

  return services
    .map((service) => {
      const version = service.versions[0];
      if (!version) return null;
      const hasValidHandoff = version.handoffs.some((handoff) =>
        isAllowedOfficialUrl(handoff.officialUrl, officialDomainAllowlist),
      );
      if (!hasValidHandoff) return null;

      return {
        service,
        version,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export async function listPublishedServices(input: {
  category?: string;
  page?: number;
}): Promise<CatalogPage> {
  const page = input.page ?? 1;
  const all = await publishedServicesWithValidHandoff(input.category);
  const total = all.length;
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: all.slice(start, start + PAGE_SIZE).map(({ service, version }) =>
      toCatalogItem({
        id: service.id,
        code: service.code,
        slug: service.slug,
        title: service.title,
        category: service.category,
        version,
      }),
    ),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function listReportableServices() {
  const all = await publishedServicesWithValidHandoff();
  return all.map(({ service }) => ({
    id: service.id,
    title: service.title,
  }));
}

export async function getPublishedServiceBySlug(slug: string): Promise<CatalogDetail | null> {
  const service = await prisma.service.findFirst({
    where: {
      slug,
      lifecycleStatus: "ACTIVE",
      versions: { some: publishedVersionWhere },
    },
    include: {
      category: true,
      versions: {
        where: publishedVersionWhere,
        orderBy: publishedVersionOrder,
        take: 1,
        include: {
          verifiedBy: { select: { name: true } },
          sources: {
            include: { officialSource: true },
          },
          requirements: { orderBy: { sortOrder: "asc" } },
          steps: { orderBy: { sortOrder: "asc" } },
          handoffs: true,
        },
      },
    },
  });

  const version = service?.versions[0];
  if (!service || !version) return null;

  const sources = version.sources
    .map((versionSource) => {
      const source = versionSource.officialSource;
      if (!parseHttpUrl(source.url)) return null;
      return {
        id: source.id,
        agencyName: source.agencyName,
        title: source.title,
        url: source.url,
        lastCheckedAt: source.lastCheckedAt,
        evidenceNote: versionSource.evidenceNote,
      };
    })
    .filter((source): source is NonNullable<typeof source> => source !== null);

  const handoffs = version.handoffs
    .filter((handoff) => isAllowedOfficialUrl(handoff.officialUrl, officialDomainAllowlist))
    .map((handoff) => ({
      id: handoff.id,
      label: handoff.label,
      officialUrl: handoff.officialUrl,
      channelType: handoff.channelType,
      caveat: handoff.caveat,
    }));

  if (sources.length === 0 || handoffs.length === 0) return null;

  return {
    ...toCatalogItem({
      id: service.id,
      code: service.code,
      slug: service.slug,
      title: service.title,
      category: service.category,
      version,
    }),
    eligibilityNote: version.eligibilityNote,
    verifiedByName: version.verifiedBy?.name ?? null,
    sources,
    requirements: version.requirements.map((requirement) => ({
      id: requirement.id,
      title: requirement.title,
      guidance: requirement.guidance,
      conditionNote: requirement.conditionNote,
      isRequired: requirement.isRequired,
      sortOrder: requirement.sortOrder,
    })),
    steps: version.steps.map((step) => ({
      id: step.id,
      title: step.title,
      guidance: step.guidance,
      stepKind: step.stepKind,
      sortOrder: step.sortOrder,
    })),
    handoffs,
  };
}
