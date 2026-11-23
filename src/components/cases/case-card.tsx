import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { caseStatusLabels } from "@/modules/cases/labels";
import type { CaseSummary } from "@/modules/cases/types";

const statusStyles: Record<CaseSummary["status"], string> = {
  IN_PROGRESS: "bg-teal-50 text-teal-800",
  USER_MARKED_DONE: "bg-emerald-50 text-emerald-800",
  ARCHIVED: "bg-slate-100 text-slate-700",
};

function percent(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function CaseCard({ serviceCase }: { serviceCase: CaseSummary }) {
  const requirementPercent = percent(serviceCase.requirementReady, serviceCase.requirementTotal);
  const stepPercent = percent(serviceCase.stepDone, serviceCase.stepTotal);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1">
          {serviceCase.service.categoryName}
        </span>
        <span className={`rounded-full px-2.5 py-1 ${statusStyles[serviceCase.status]}`}>
          {caseStatusLabels[serviceCase.status]}
        </span>
      </div>

      <div className="mt-3 flex-1">
        <CardTitle>
          <Link href={`/pengurusan/${serviceCase.id}`} className="hover:underline">
            {serviceCase.service.title}
          </Link>
        </CardTitle>
        <CardDescription>
          Versi {serviceCase.versionNumber} · dimulai {formatDate(serviceCase.startedAt)}
        </CardDescription>
      </div>

      {serviceCase.staleVersion ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-950">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Panduan diperbarui ke versi {serviceCase.staleVersion.versionNumber}.{" "}
            <Link
              href={`/layanan/${serviceCase.staleVersion.slug}`}
              className="font-semibold underline"
            >
              Lihat panduan baru
            </Link>
            . Progres lama tidak diubah.
          </p>
        </div>
      ) : null}

      <div className="text-muted mt-4 space-y-2 text-xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span>Syarat siap</span>
            <span>
              {serviceCase.requirementReady}/{serviceCase.requirementTotal}
            </span>
          </div>
          <div className="bg-muted-background mt-1 h-1.5 rounded-full">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${requirementPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <span>Langkah selesai</span>
            <span>
              {serviceCase.stepDone}/{serviceCase.stepTotal}
            </span>
          </div>
          <div className="bg-muted-background mt-1 h-1.5 rounded-full">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${stepPercent}%` }} />
          </div>
        </div>
      </div>

      <p className="text-foreground mt-4 text-sm font-medium">
        Berikutnya: {serviceCase.nextAction}
      </p>

      <Link
        href={`/pengurusan/${serviceCase.id}`}
        className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
      >
        Buka pengurusan
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Card>
  );
}
