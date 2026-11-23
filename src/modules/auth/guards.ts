import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "./config";

export const getSession = cache(() => getServerSession(authOptions));

export async function requireUser(callbackUrl = "/dashboard") {
  const session = await getSession();
  if (!session?.user) {
    const safeCallback =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";
    redirect(`/masuk?callbackUrl=${encodeURIComponent(safeCallback)}`);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.user.role !== "ADMIN") {
    notFound();
  }
  return session;
}
