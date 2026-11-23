import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getPublishedServiceBySlug, listPublishedServices } from "@/modules/catalog/queries";
import { searchPublishedServices } from "@/modules/catalog/search";
import { createTestPrisma, resetDatabase } from "../helpers/db";
import {
  createAdmin,
  createCategory,
  createPublishedVersion,
  createService,
} from "../helpers/factories";

const testPrisma = createTestPrisma();

describe("katalog publik", () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await testPrisma.$disconnect();
  });

  async function seedPublishedService(options?: {
    code?: string;
    slug?: string;
    title?: string;
    handoffUrl?: string;
    aliases?: string[];
  }) {
    const category = await createCategory(testPrisma, "ktp");
    const admin = await createAdmin(testPrisma);
    const service = await createService(testPrisma, {
      categoryId: category.id,
      code: options?.code ?? "KTP-02",
      slug: options?.slug ?? "ktp-el-hilang",
      title: options?.title ?? "Penggantian KTP-el hilang",
    });

    for (const phrase of options?.aliases ?? []) {
      await testPrisma.serviceAlias.create({
        data: { serviceId: service.id, phrase },
      });
    }

    const version = await createPublishedVersion(testPrisma, {
      serviceId: service.id,
      adminId: admin.id,
      handoffUrl: options?.handoffUrl,
    });

    return { category, admin, service, version };
  }

  it("hanya mengembalikan versi PUBLISHED yang lengkap", async () => {
    const category = await createCategory(testPrisma, "ktp");
    const admin = await createAdmin(testPrisma);

    const validService = await createService(testPrisma, {
      categoryId: category.id,
      code: "KTP-02",
      slug: "ktp-el-hilang",
      title: "Penggantian KTP-el hilang",
    });
    await createPublishedVersion(testPrisma, {
      serviceId: validService.id,
      adminId: admin.id,
    });

    const draftService = await createService(testPrisma, {
      categoryId: category.id,
      code: "KTP-01",
      slug: "ktp-el-pertama",
      title: "Perekaman KTP-el pertama",
    });
    await testPrisma.serviceVersion.create({
      data: {
        serviceId: draftService.id,
        versionNumber: 1,
        status: "DRAFT",
        summary: "Draf tidak boleh tampil.",
      },
    });

    const incompleteService = await createService(testPrisma, {
      categoryId: category.id,
      code: "KTP-03",
      slug: "ktp-el-rusak",
      title: "Penggantian KTP-el rusak",
    });
    await testPrisma.serviceVersion.create({
      data: {
        serviceId: incompleteService.id,
        versionNumber: 1,
        status: "PUBLISHED",
        summary: "PUBLISHED tanpa sumber dan handoff.",
        verifiedAt: new Date(),
        verifiedById: admin.id,
        publishedAt: new Date(),
      },
    });

    const page = await listPublishedServices({});
    expect(page.items.map((item) => item.code)).toEqual(["KTP-02"]);
    expect(page.total).toBe(1);
  });

  it("menemukan layanan lewat FTS, alias, dan typo", async () => {
    await seedPublishedService({
      aliases: ["ktp ilang", "ktp hilang"],
      title: "Penggantian KTP-el hilang",
    });

    const fuzzy = await searchPublishedServices({ query: "ktp ilang" });
    const fullText = await searchPublishedServices({ query: "ktp hilang" });
    const none = await searchPublishedServices({ query: "zzz tidak ada" });

    expect(fuzzy.items[0]?.slug).toBe("ktp-el-hilang");
    expect(fullText.items[0]?.slug).toBe("ktp-el-hilang");
    expect(none.total).toBe(0);
  });

  it("menyembunyikan layanan dengan handoff di luar allowlist", async () => {
    await seedPublishedService({ handoffUrl: "https://evil.example/kanal" });

    const page = await listPublishedServices({});
    expect(page.total).toBe(0);
    expect(await getPublishedServiceBySlug("ktp-el-hilang")).toBeNull();
  });

  it("mengembalikan detail lengkap untuk layanan valid", async () => {
    await seedPublishedService();

    const detail = await getPublishedServiceBySlug("ktp-el-hilang");
    expect(detail?.title).toBe("Penggantian KTP-el hilang");
    expect(detail?.sources).toHaveLength(1);
    expect(detail?.requirements).toHaveLength(1);
    expect(detail?.steps).toHaveLength(1);
    expect(detail?.handoffs[0]?.officialUrl).toBe("https://example.com/kanal-uji");
  });
});
