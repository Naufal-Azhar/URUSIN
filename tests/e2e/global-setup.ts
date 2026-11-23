import { execSync } from "node:child_process";
import { Client } from "pg";

async function resetTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL tidak tersedia untuk E2E.");
  }
  if (!databaseUrl.includes("urusin_test") && !databaseUrl.includes("urusin_e2e")) {
    throw new Error("E2E harus memakai database test, bukan database development.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
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
  } finally {
    await client.end();
  }
}

export default async function globalSetup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  await resetTestDatabase();

  execSync("npx tsx prisma/seed.demo.ts", {
    stdio: "inherit",
    env: process.env,
  });
}
