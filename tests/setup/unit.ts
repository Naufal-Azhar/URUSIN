process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://urusin_app:test@127.0.0.1:5433/urusin_test?schema=public";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000";
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
process.env.EMAIL_TRANSPORT = process.env.EMAIL_TRANSPORT ?? "mailpit";
process.env.EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST ?? "127.0.0.1";
process.env.EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT ?? "1025";
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? "URUSIN Test <no-reply@urusin.test>";
process.env.OFFICIAL_DOMAIN_ALLOWLIST = process.env.OFFICIAL_DOMAIN_ALLOWLIST ?? "example.com";
