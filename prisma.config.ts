import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.MIGRATE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://urusin_migrator:change-me@127.0.0.1:5433/urusin?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
