import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  throw new Error("seed.demo.ts tidak boleh dijalankan di production.");
}

const databaseUrl = process.env.SEED_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL atau SEED_DATABASE_URL wajib diisi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const now = new Date();

async function cleanupDemo() {
  const services = await prisma.service.findMany({
    where: { code: { in: ["DEMO-01", "DEMO-02", "DEMO-99"] } },
    select: { id: true },
  });

  for (const service of services) {
    await prisma.serviceCase.deleteMany({
      where: { serviceVersion: { serviceId: service.id } },
    });
    await prisma.contentReport.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceVersion.deleteMany({ where: { serviceId: service.id } });
    await prisma.service.delete({ where: { id: service.id } });
  }

  await prisma.officialSource.deleteMany({
    where: {
      url: {
        in: ["https://example.com/sumber-uji", "https://example.com/sumber-uji-2"],
      },
    },
  });
}

async function main() {
  await cleanupDemo();

  const category = await prisma.serviceCategory.upsert({
    where: { slug: "contoh" },
    update: { name: "Contoh Uji", sortOrder: 99 },
    create: { slug: "contoh", name: "Contoh Uji", sortOrder: 99 },
  });

  const admin = await prisma.user.upsert({
    where: { email: "demo-admin@example.test" },
    update: { role: "ADMIN", deletedAt: null },
    create: {
      email: "demo-admin@example.test",
      name: "Admin Demo",
      role: "ADMIN",
    },
  });

  const published = await prisma.service.create({
    data: {
      categoryId: category.id,
      code: "DEMO-01",
      slug: "contoh-ktp-hilang",
      title: "[CONTOH UJI] Penggantian KTP hilang",
      lifecycleStatus: "ACTIVE",
      aliases: {
        create: [
          { phrase: "ktp hilang" },
          { phrase: "ktp ilang" },
          { phrase: "contoh ktp hilang" },
        ],
      },
    },
  });

  const version = await prisma.serviceVersion.create({
    data: {
      serviceId: published.id,
      versionNumber: 1,
      status: "PUBLISHED",
      summary:
        "[CONTOH UJI] Panduan ini hanya untuk pengujian antarmuka dan bukan prosedur resmi. Jangan gunakan sebagai sumber persyaratan sebenarnya.",
      eligibilityNote:
        "Data contoh untuk pengujian. Persyaratan, biaya, dan kanal resmi wajib diverifikasi ulang sebelum dipublikasikan sebagai konten nyata.",
      verifiedAt: now,
      verifiedById: admin.id,
      publishedAt: now,
    },
  });

  const source = await prisma.officialSource.create({
    data: {
      agencyName: "Instansi Contoh Uji",
      title: "Sumber contoh untuk pengujian",
      url: "https://example.com/sumber-uji",
      lastCheckedAt: now,
    },
  });

  await prisma.versionSource.create({
    data: {
      serviceVersionId: version.id,
      officialSourceId: source.id,
      evidenceNote: "Fixture test. Bukan sumber resmi.",
    },
  });

  await prisma.requirement.createMany({
    data: [
      {
        serviceVersionId: version.id,
        title: "[CONTOH] Dokumen identitas",
        guidance:
          "Item contoh untuk menguji tampilan checklist. Jangan mengunggah dokumen asli ke URUSIN.",
        sortOrder: 1,
        isRequired: true,
      },
      {
        serviceVersionId: version.id,
        title: "[CONTOH] Surat kehilangan",
        guidance:
          "Item kondisional contoh. Persyaratan sebenarnya harus diverifikasi pada sumber resmi.",
        conditionNote: "Jika dokumen hilang",
        sortOrder: 2,
        isRequired: false,
      },
    ],
  });

  await prisma.workflowStep.createMany({
    data: [
      {
        serviceVersionId: version.id,
        title: "[CONTOH] Siapkan dokumen",
        guidance: "Langkah contoh untuk pengujian. URUSIN tidak menyimpan dokumen identitas.",
        stepKind: "PREPARE",
        sortOrder: 1,
      },
      {
        serviceVersionId: version.id,
        title: "[CONTOH] Datang ke kanal resmi",
        guidance:
          "Langkah contoh. Pengajuan sebenarnya dilakukan di kanal instansi, bukan di URUSIN.",
        stepKind: "HANDOFF",
        sortOrder: 2,
      },
    ],
  });

  await prisma.officialHandoff.create({
    data: {
      serviceVersionId: version.id,
      label: "[CONTOH] Kanal resmi uji",
      officialUrl: "https://example.com/kanal-uji",
      channelType: "WEB",
      caveat: "Tautan contoh untuk pengujian. Bukan kanal pemerintah sebenarnya.",
    },
  });

  const simCategory = await prisma.serviceCategory.upsert({
    where: { slug: "sim" },
    update: { name: "SIM", sortOrder: 3 },
    create: { slug: "sim", name: "SIM", sortOrder: 3 },
  });

  const simService = await prisma.service.create({
    data: {
      categoryId: simCategory.id,
      code: "DEMO-02",
      slug: "contoh-sim-c",
      title: "[CONTOH UJI] Perpanjangan SIM C",
      lifecycleStatus: "ACTIVE",
      aliases: {
        create: [{ phrase: "sim c" }, { phrase: "perpanjang sim c" }],
      },
    },
  });

  const simVersion = await prisma.serviceVersion.create({
    data: {
      serviceId: simService.id,
      versionNumber: 1,
      status: "PUBLISHED",
      summary:
        "[CONTOH UJI] Panduan perpanjangan SIM C untuk pengujian antarmuka. Bukan prosedur resmi.",
      eligibilityNote: "Data contoh. Persyaratan nyata harus diverifikasi pada sumber resmi.",
      verifiedAt: now,
      verifiedById: admin.id,
      publishedAt: now,
    },
  });

  const simSource = await prisma.officialSource.create({
    data: {
      agencyName: "Instansi Contoh Uji",
      title: "Sumber contoh SIM untuk pengujian",
      url: "https://example.com/sumber-uji-2",
      lastCheckedAt: now,
    },
  });

  await prisma.versionSource.create({
    data: {
      serviceVersionId: simVersion.id,
      officialSourceId: simSource.id,
      evidenceNote: "Fixture test. Bukan sumber resmi.",
    },
  });

  await prisma.requirement.create({
    data: {
      serviceVersionId: simVersion.id,
      title: "[CONTOH] SIM yang masih berlaku",
      guidance: "Item contoh untuk pengujian. Jangan mengunggah dokumen asli.",
      sortOrder: 1,
      isRequired: true,
    },
  });

  await prisma.workflowStep.create({
    data: {
      serviceVersionId: simVersion.id,
      title: "[CONTOH] Siapkan persyaratan SIM",
      guidance: "Langkah contoh untuk pengujian alur workspace.",
      stepKind: "PREPARE",
      sortOrder: 1,
    },
  });

  await prisma.officialHandoff.create({
    data: {
      serviceVersionId: simVersion.id,
      label: "[CONTOH] Kanal SIM uji",
      officialUrl: "https://example.com/kanal-uji-2",
      channelType: "WEB",
      caveat: "Tautan contoh untuk pengujian. Bukan kanal pemerintah sebenarnya.",
    },
  });

  const draft = await prisma.service.create({
    data: {
      categoryId: category.id,
      code: "DEMO-99",
      slug: "contoh-draf",
      title: "[CONTOH UJI] Layanan draf tidak boleh tampil",
      lifecycleStatus: "ACTIVE",
    },
  });

  await prisma.serviceVersion.create({
    data: {
      serviceId: draft.id,
      versionNumber: 1,
      status: "DRAFT",
      summary: "Fixture DRAFT untuk memastikan katalog publik tidak membocorkan draf.",
    },
  });

  console.log(
    JSON.stringify({
      event: "seed.demo.completed",
      publishedService: published.code,
      secondPublishedService: simService.code,
      draftService: draft.code,
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        event: "seed.demo.failed",
        errorCode: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
