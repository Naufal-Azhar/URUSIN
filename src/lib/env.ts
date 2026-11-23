import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL wajib diisi.")
    .refine((value) => value.startsWith("postgresql://"), {
      message: "DATABASE_URL harus berupa koneksi PostgreSQL.",
    }),
  NEXTAUTH_URL: z.url("NEXTAUTH_URL harus berupa URL yang valid."),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET minimal 32 karakter."),
  EMAIL_TRANSPORT: z.enum(["mailpit"]).default("mailpit"),
  EMAIL_SERVER_HOST: z.string().min(1).default("127.0.0.1"),
  EMAIL_SERVER_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_FROM: z.string().min(3, "EMAIL_FROM wajib diisi."),
  OFFICIAL_DOMAIN_ALLOWLIST: z.string().default(""),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAGIC_LINK_PER_IP: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_MAGIC_LINK_PER_EMAIL: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_REPORT_PER_IP: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_AUTH_PER_IP: z.coerce.number().int().positive().default(60),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SEED_ADMIN_EMAIL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
}

export const env = parsed.data;

export const officialDomainAllowlist = env.OFFICIAL_DOMAIN_ALLOWLIST.split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);
