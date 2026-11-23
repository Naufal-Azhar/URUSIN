import "server-only";
import { prisma } from "@/lib/db";

export async function listAdminCategories() {
  return prisma.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getAdminDashboardData() {
  const [services, drafts, inReview, published, openReports] = await Promise.all([
    prisma.service.count(),
    prisma.serviceVersion.count({ where: { status: "DRAFT" } }),
    prisma.serviceVersion.count({ where: { status: "IN_REVIEW" } }),
    prisma.serviceVersion.count({ where: { status: "PUBLISHED" } }),
    prisma.contentReport.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
  ]);

  return { services, drafts, inReview, published, openReports };
}

export async function listAdminServices() {
  return prisma.service.findMany({
    include: {
      category: { select: { name: true, slug: true } },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
        },
        orderBy: { versionNumber: "desc" },
      },
    },
    orderBy: { code: "asc" },
  });
}

export async function getAdminServiceDetail(serviceId: string) {
  return prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      category: { select: { name: true, slug: true } },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
          verifiedAt: true,
          _count: {
            select: { sources: true, requirements: true, steps: true, handoffs: true },
          },
        },
        orderBy: { versionNumber: "desc" },
      },
    },
  });
}

export async function getAdminVersionDetail(versionId: string) {
  return prisma.serviceVersion.findUnique({
    where: { id: versionId },
    include: {
      service: {
        include: { category: { select: { name: true, slug: true } } },
      },
      verifiedBy: { select: { name: true } },
      sources: {
        include: { officialSource: true },
      },
      requirements: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { sortOrder: "asc" } },
      handoffs: { orderBy: { label: "asc" } },
      revisions: {
        include: {
          author: { select: { name: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function listReviewQueue() {
  return prisma.serviceVersion.findMany({
    where: { status: "IN_REVIEW" },
    include: {
      service: {
        include: { category: { select: { name: true } } },
      },
      _count: {
        select: { sources: true, requirements: true, steps: true, handoffs: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAdminReports() {
  return prisma.contentReport.findMany({
    include: {
      service: { select: { code: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listAdminAuditEvents() {
  return prisma.auditEvent.findMany({
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
