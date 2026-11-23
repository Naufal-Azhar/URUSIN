"use server";

import { getClientIp } from "@/lib/request";
import { getSession } from "@/modules/auth/guards";
import { reportSchema } from "./schemas";
import { submitReport } from "./service";
import type { ReportActionState } from "./types";

export async function submitReportAction(
  _previousState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return {
      status: "success",
      message: "Terima kasih. Laporan akan ditinjau oleh admin kurasi.",
    };
  }

  const parsed = reportSchema.safeParse({
    serviceId: String(formData.get("serviceId") ?? ""),
    issueType: String(formData.get("issueType") ?? ""),
    message: String(formData.get("message") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Periksa kembali laporan Anda.",
    };
  }

  const session = await getSession();
  const result = await submitReport({
    ...parsed.data,
    reporterId: session?.user.id ?? null,
    ip: await getClientIp(),
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "success",
    message: "Terima kasih. Laporan akan ditinjau oleh admin kurasi.",
  };
}
