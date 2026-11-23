import { config } from "dotenv";

config({ path: ".env.test", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL test wajib diisi melalui .env.test.");
}
