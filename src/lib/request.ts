import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export async function getClientIp() {
  if (!env.TRUST_PROXY) return "local";

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}
