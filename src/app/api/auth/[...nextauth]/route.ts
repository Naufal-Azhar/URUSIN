import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { checkRateLimit, hashRateLimitKey } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/request";
import { authOptions } from "@/modules/auth/config";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);

type RouteContext = {
  params: Promise<{ nextauth: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const ip = getClientIpFromRequest(request);
  const limit = checkRateLimit(
    `auth:${hashRateLimitKey(ip)}`,
    env.RATE_LIMIT_AUTH_PER_IP,
    env.RATE_LIMIT_WINDOW_MS,
  );

  if (!limit.allowed) {
    return new Response("Terlalu banyak permintaan autentikasi. Coba lagi nanti.", {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(limit.retryAfterSeconds),
      },
    });
  }

  return handler(request, context);
}
