import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { isNormalizedAsciiEmail, normalizeEmail } from "../src/lib/security";

const rawEmail = process.argv[2];

if (!rawEmail) {
  console.error("Penggunaan: npm run admin:promote -- alamat@email.test");
  process.exitCode = 1;
  process.exit();
}

const email = normalizeEmail(rawEmail);

if (!isNormalizedAsciiEmail(email)) {
  console.error("Email tidak valid. Gunakan alamat ASCII yang valid.");
  process.exitCode = 1;
  process.exit();
}

const databaseUrl = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL atau MIGRATE_DATABASE_URL wajib diisi.");
  process.exitCode = 1;
  process.exit();
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        name: "Admin",
        role: "ADMIN",
      },
    }));

  const promoted = !existing || existing.role !== "ADMIN" || Boolean(existing.deletedAt);

  if (existing && promoted) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", deletedAt: null },
    });
  }

  await prisma.auditEvent.create({
    data: {
      actorId: null,
      entityType: "User",
      entityId: user.id,
      action: "ADMIN_PROMOTE",
      detail: "Promosi admin melalui CLI",
    },
  });

  console.log(
    JSON.stringify({
      event: "admin.promote",
      created: !existing,
      promoted,
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({
        event: "admin.promote.failed",
        errorCode: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
