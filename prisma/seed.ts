import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.SEED_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL atau SEED_DATABASE_URL wajib diisi untuk seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const categories = [
  { slug: "ktp", name: "KTP", sortOrder: 1 },
  { slug: "kk", name: "Kartu Keluarga", sortOrder: 2 },
  { slug: "sim", name: "SIM", sortOrder: 3 },
];

const services = [
  {
    code: "KTP-01",
    slug: "ktp-el-pertama",
    title: "Perekaman/penerbitan KTP-el pertama kali",
    category: "ktp",
    aliases: ["buat ktp", "ktp pertama", "perekaman ktp", "ktp el"],
  },
  {
    code: "KTP-02",
    slug: "ktp-el-hilang",
    title: "Penggantian KTP-el hilang",
    category: "ktp",
    aliases: ["ktp hilang", "ktp ilang", "kehilangan ktp", "ganti ktp hilang"],
  },
  {
    code: "KTP-03",
    slug: "ktp-el-rusak",
    title: "Penggantian KTP-el rusak",
    category: "ktp",
    aliases: ["ktp rusak", "ganti ktp rusak", "ktp patah"],
  },
  {
    code: "KK-01",
    slug: "kk-keluarga-baru",
    title: "Penerbitan KK karena pembentukan keluarga",
    category: "kk",
    aliases: ["buat kk", "kk baru", "kk keluarga baru", "kk setelah menikah"],
  },
  {
    code: "KK-02",
    slug: "kk-perubahan-data",
    title: "Perubahan data/anggota keluarga pada KK",
    category: "kk",
    aliases: ["ubah kk", "tambah anggota kk", "kurangi anggota kk", "update kk"],
  },
  {
    code: "KK-03",
    slug: "kk-hilang-rusak",
    title: "Penggantian KK hilang atau rusak",
    category: "kk",
    aliases: ["kk hilang", "kk ilang", "kk rusak", "ganti kk"],
  },
  {
    code: "SIM-01",
    slug: "sim-a-perpanjangan",
    title: "Perpanjangan SIM A",
    category: "sim",
    aliases: ["perpanjang sim a", "sim a", "perpanjangan sim a"],
  },
  {
    code: "SIM-02",
    slug: "sim-c-perpanjangan",
    title: "Perpanjangan SIM C",
    category: "sim",
    aliases: ["perpanjang sim c", "sim c", "perpanjangan sim c"],
  },
];

function draftSummary(title: string) {
  return [
    `Kandidat panduan untuk ${title}.`,
    "Konten belum diverifikasi, belum memiliki sumber resmi, dan tidak dipublikasikan.",
    "Admin wajib memeriksa persyaratan, biaya, tahapan, dan kanal resmi sebelum publish.",
  ].join(" ");
}

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
    categoryIds.set(category.slug, row.id);
  }

  let serviceCount = 0;
  let versionCount = 0;
  let aliasCount = 0;

  for (const service of services) {
    const categoryId = categoryIds.get(service.category);
    if (!categoryId) {
      throw new Error(`Kategori ${service.category} tidak ditemukan.`);
    }

    const serviceRow = await prisma.service.upsert({
      where: { code: service.code },
      update: {
        slug: service.slug,
        title: service.title,
        categoryId,
        lifecycleStatus: "ACTIVE",
      },
      create: {
        code: service.code,
        slug: service.slug,
        title: service.title,
        categoryId,
        lifecycleStatus: "ACTIVE",
      },
    });
    serviceCount += 1;

    await prisma.serviceVersion.upsert({
      where: {
        serviceId_versionNumber: {
          serviceId: serviceRow.id,
          versionNumber: 1,
        },
      },
      update: {
        summary: draftSummary(service.title),
        status: "DRAFT",
        eligibilityNote: null,
        verifiedAt: null,
        verifiedById: null,
        publishedAt: null,
      },
      create: {
        serviceId: serviceRow.id,
        versionNumber: 1,
        status: "DRAFT",
        summary: draftSummary(service.title),
      },
    });
    versionCount += 1;

    for (const phrase of service.aliases) {
      await prisma.serviceAlias.upsert({
        where: {
          serviceId_phrase: {
            serviceId: serviceRow.id,
            phrase: phrase.toLowerCase(),
          },
        },
        update: {},
        create: {
          serviceId: serviceRow.id,
          phrase: phrase.toLowerCase(),
        },
      });
      aliasCount += 1;
    }
  }

  let adminCreated = false;
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();

  if (seedAdminEmail && process.env.NODE_ENV !== "production") {
    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: { role: "ADMIN" },
      create: {
        email: seedAdminEmail,
        name: "Admin Development",
        role: "ADMIN",
      },
    });
    adminCreated = true;
  }

  console.log(
    JSON.stringify({
      event: "seed.completed",
      categories: categories.length,
      services: serviceCount,
      draftVersions: versionCount,
      aliases: aliasCount,
      adminCreated,
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        event: "seed.failed",
        errorCode: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
