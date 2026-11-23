import "server-only";
import type { AdapterUser } from "next-auth/adapters";
import type { NextAuthOptions } from "next-auth";
import { env } from "@/lib/env";
import { logError, logWarn } from "@/lib/logger";
import { safeRedirectUrl } from "@/lib/security";
import { authAdapter } from "./adapter";
import { magicLinkProvider } from "./email/provider";

type AppRole = "CITIZEN" | "ADMIN";

export const authOptions: NextAuthOptions = {
  adapter: authAdapter,
  providers: [magicLinkProvider as unknown as NextAuthOptions["providers"][number]],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/masuk",
    verifyRequest: "/masuk/cek-email",
    error: "/masuk/error",
  },
  secret: env.NEXTAUTH_SECRET,
  debug: false,
  useSecureCookies: env.NODE_ENV === "production",
  logger: {
    error(code) {
      logError("auth.error", new Error(code), { errorCode: code });
    },
    warn(code) {
      logWarn("auth.warn", { errorCode: code });
    },
    debug() {
      // Log detail Auth.js tidak diaktifkan agar tidak bocor data sensitif.
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const adapterUser = user as AdapterUser & { role?: AppRole };
        session.user.id = adapterUser.id;
        session.user.role = adapterUser.role ?? "CITIZEN";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return safeRedirectUrl(url, baseUrl);
    },
  },
};
