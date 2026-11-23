import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export function createTestPrisma() {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL wajib diisi untuk integration test.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: ["warn", "error"],
  });
}

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditEvent",
      "ContentRevision",
      "ContentReport",
      "StepProgress",
      "RequirementProgress",
      "ServiceCase",
      "OfficialHandoff",
      "WorkflowStep",
      "Requirement",
      "VersionSource",
      "OfficialSource",
      "ServiceVersion",
      "ServiceAlias",
      "Service",
      "ServiceCategory",
      "VerificationToken",
      "Session",
      "Account",
      "User"
    RESTART IDENTITY CASCADE
  `);
}
