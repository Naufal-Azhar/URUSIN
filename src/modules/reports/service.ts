import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit, hashRateLimitKey } from "@/lib/rate-limit";
import { reportSchema, type ReportInput } from "./schemas";

const REPORT_WINDOW_MS = 60 * 60 * 1000;

export type SubmitReportResult = { ok: true } | { ok: false; message: string };

export async function submitReport(input: {
  serviceId: string;
  issueType: ReportInput["issueType"];
  message: string;
  reporterId: string | null;
  ip: string;
}): Promise<SubmitReportResult> {
  const parsed = reportSchema.safeParse({
    serviceId: input.serviceId,
    issueType: input.issueType,
    message: input.message,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Periksa kembali laporan Anda.",
    };
  }

  const limit = checkRateLimit(
    `report:${hashRateLimitKey(input.ip)}`,
    env.RATE_LIMIT_REPORT_PER_IP,
    REPORT_WINDOW_MS,
  );

  if (!limit.allowed) {
    return {
      ok: false,
      message: "Terlalu banyak laporan dari perangkat ini. Coba lagi nanti.",
    };
  }

  const service = await prisma.service.findFirst({
    where: {
      id: parsed.data.serviceId,
      lifecycleStatus: "ACTIVE",
    },
    select: { id: true },
  });

  if (!service) {
    return {
      ok: false,
      message: "Layanan tidak ditemukan atau sudah tidak aktif.",
    };
  }

  await prisma.contentReport.create({
    data: {
      serviceId: service.id,
      reporterId: input.reporterId,
      issueType: parsed.data.issueType,
      message: parsed.data.message,
    },
  });

  return { ok: true };
}
