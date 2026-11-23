import type { DefaultSession } from "next-auth";

type AppRole = "CITIZEN" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: AppRole;
  }
}
