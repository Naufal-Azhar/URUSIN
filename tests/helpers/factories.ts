import type { PrismaClient } from "@/generated/prisma/client";

export async function createCategory(prisma: PrismaClient, slug = "ktp") {
  return prisma.serviceCategory.create({
    data: { slug, name: slug.toUpperCase(), sortOrder: 1 },
  });
}

export async function createService(
  prisma: PrismaClient,
  input: { categoryId: string; code?: string; slug?: string; title?: string },
) {
  return prisma.service.create({
    data: {
      categoryId: input.categoryId,
      code: input.code ?? "KTP-02",
      slug: input.slug ?? "ktp-el-hilang",
      title: input.title ?? "Penggantian KTP-el hilang",
    },
  });
}

export async function createVersion(
  prisma: PrismaClient,
  input: {
    serviceId: string;
    versionNumber?: number;
    status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
    verifiedById?: string;
  },
) {
  return prisma.serviceVersion.create({
    data: {
      serviceId: input.serviceId,
      versionNumber: input.versionNumber ?? 1,
      status: input.status ?? "DRAFT",
      summary: "Ringkasan fixture test.",
      verifiedAt: input.status === "PUBLISHED" ? new Date() : null,
      verifiedById: input.verifiedById ?? null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
  });
}

export async function createUser(prisma: PrismaClient, email = "user@example.test") {
  return prisma.user.create({ data: { email } });
}

export async function createAdmin(prisma: PrismaClient, email = "admin@example.test") {
  return prisma.user.create({
    data: { email, name: "Admin Uji", role: "ADMIN" },
  });
}

export async function createPublishedVersion(
  prisma: PrismaClient,
  input: {
    serviceId: string;
    adminId: string;
    versionNumber?: number;
    handoffUrl?: string;
    sourceUrl?: string;
    summary?: string;
  },
) {
  const now = new Date();
  const version = await prisma.serviceVersion.create({
    data: {
      serviceId: input.serviceId,
      versionNumber: input.versionNumber ?? 1,
      status: "PUBLISHED",
      summary: input.summary ?? "Ringkasan fixture layanan terverifikasi.",
      verifiedAt: now,
      verifiedById: input.adminId,
      publishedAt: now,
    },
  });

  const source = await prisma.officialSource.create({
    data: {
      agencyName: "Instansi Uji",
      title: "Sumber Uji",
      url: input.sourceUrl ?? "https://example.com/sumber-uji",
      lastCheckedAt: now,
    },
  });

  await prisma.versionSource.create({
    data: { serviceVersionId: version.id, officialSourceId: source.id },
  });

  await prisma.requirement.create({
    data: {
      serviceVersionId: version.id,
      title: "Dokumen uji",
      guidance: "Panduan fixture test.",
      sortOrder: 1,
      isRequired: true,
    },
  });

  await prisma.workflowStep.create({
    data: {
      serviceVersionId: version.id,
      title: "Langkah uji",
      guidance: "Panduan langkah fixture test.",
      stepKind: "PREPARE",
      sortOrder: 1,
    },
  });

  await prisma.officialHandoff.create({
    data: {
      serviceVersionId: version.id,
      label: "Kanal Uji",
      officialUrl: input.handoffUrl ?? "https://example.com/kanal-uji",
      channelType: "WEB",
    },
  });

  return version;
}
