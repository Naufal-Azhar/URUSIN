import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, MapPin } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/cases/confirm-delete-button";
import { RequirementCheckbox } from "@/components/cases/requirement-checkbox";
import { StepStatusSelect } from "@/components/cases/step-status-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/modules/auth/guards";
import { archiveCaseAction, deleteCaseAction, markCaseDoneAction } from "@/modules/cases/actions";
import { caseStatusLabels, stepStatusLabels } from "@/modules/cases/labels";
import { getOwnedCaseDetail } from "@/modules/cases/queries";
import { channelTypeLabels, stepKindLabels } from "@/modules/catalog/labels";

type PengurusanPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengurusan",
};

const statusStyles = {
  IN_PROGRESS: "bg-teal-50 text-teal-800",
  USER_MARKED_DONE: "bg-emerald-50 text-emerald-800",
  ARCHIVED: "bg-slate-100 text-slate-700",
} as const;

function hostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function PengurusanPage({ params }: PengurusanPageProps) {
  const { id } = await params;
  const session = await requireUser(`/pengurusan/${id}`);
  const detail = await getOwnedCaseDetail(id, session.user.id);

  if (!detail) notFound();

  const isArchived = detail.status === "ARCHIVED";
  const requirementPercent =
    detail.requirementTotal > 0
      ? Math.round((detail.requirementReady / detail.requirementTotal) * 100)
      : 0;
  const stepPercent =
    detail.stepTotal > 0 ? Math.round((detail.stepDone / detail.stepTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard"
          className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke dashboard
        </Link>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1">
            {detail.service.categoryName}
          </span>
          <span className={`rounded-full px-2.5 py-1 ${statusStyles[detail.status]}`}>
            {caseStatusLabels[detail.status]}
          </span>
          <span className="bg-muted-background text-muted rounded-full px-2.5 py-1">
            Versi {detail.versionNumber}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{detail.service.title}</h1>
          <p className="text-muted max-w-3xl text-sm leading-7">{detail.summary}</p>
          <p className="text-muted text-sm">
            Dimulai {formatDate(detail.startedAt)} · panduan diverifikasi{" "}
            {formatDate(detail.verifiedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/layanan/${detail.service.slug}`}>
              Lihat panduan layanan
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <Alert>
        Progres ini adalah catatan pribadi Anda. URUSIN tidak mengirim permohonan dan tidak
        mengetahui status resmi instansi.
      </Alert>

      {detail.staleVersion ? (
        <Alert variant="warning">
          <span className="flex items-start gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Panduan diperbarui ke versi {detail.staleVersion.versionNumber}.{" "}
              <Link
                href={`/layanan/${detail.staleVersion.slug}`}
                className="font-semibold underline"
              >
                Lihat panduan terbaru
              </Link>
              . Progres Anda pada versi ini tidak diubah otomatis.
            </span>
          </span>
        </Alert>
      ) : null}

      {isArchived ? (
        <Alert variant="warning">
          Pengurusan ini sudah diarsipkan. Checklist dan langkah tidak dapat diubah lagi, tetapi
          riwayatnya tetap dapat dibaca.
        </Alert>
      ) : null}

      <Card>
        <CardTitle>Ringkasan progres</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Syarat siap</span>
              <span className="text-muted">
                {detail.requirementReady}/{detail.requirementTotal}
              </span>
            </div>
            <div className="bg-muted-background mt-2 h-2 rounded-full">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${requirementPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Langkah selesai</span>
              <span className="text-muted">
                {detail.stepDone}/{detail.stepTotal}
              </span>
            </div>
            <div className="bg-muted-background mt-2 h-2 rounded-full">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${stepPercent}%` }} />
            </div>
          </div>
        </div>
        <p className="text-foreground mt-4 flex items-start gap-2 text-sm font-medium">
          <CheckCircle2 aria-hidden="true" className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          Berikutnya: {detail.nextAction}
        </p>
      </Card>

      <section aria-labelledby="checklist-heading" className="space-y-3">
        <div>
          <h2 id="checklist-heading" className="text-xl font-semibold">
            Checklist persyaratan
          </h2>
          <p className="text-muted mt-1 text-sm">
            Tandai item yang sudah Anda siapkan. Jangan mengunggah atau menyimpan isi dokumen di
            URUSIN.
          </p>
        </div>
        {detail.requirements.length > 0 ? (
          <ul className="space-y-3">
            {detail.requirements.map((requirement) => (
              <li
                key={requirement.id}
                className="border-border flex items-start gap-3 rounded-xl border bg-white p-4"
              >
                <RequirementCheckbox
                  caseId={detail.id}
                  requirementId={requirement.id}
                  initialReady={requirement.isReady}
                  label={`Tandai ${requirement.title} siap`}
                  disabled={isArchived}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-foreground font-semibold">{requirement.title}</h3>
                    <span className="bg-muted-background text-muted rounded-full px-2.5 py-1 text-xs font-medium">
                      {requirement.isRequired ? "Wajib" : "Kondisional"}
                    </span>
                  </div>
                  <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-line">
                    {requirement.guidance}
                  </p>
                  {requirement.conditionNote ? (
                    <p className="text-foreground mt-2 text-sm font-medium">
                      Kondisi: {requirement.conditionNote}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Alert>Belum ada checklist pada versi ini.</Alert>
        )}
      </section>

      <section aria-labelledby="langkah-heading" className="space-y-3">
        <div>
          <h2 id="langkah-heading" className="text-xl font-semibold">
            Langkah mandiri
          </h2>
          <p className="text-muted mt-1 text-sm">
            Status langkah adalah catatan Anda, bukan status instansi.
          </p>
        </div>
        {detail.steps.length > 0 ? (
          <ol className="space-y-3">
            {detail.steps.map((step, index) => (
              <li key={step.id} className="border-border rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-foreground font-semibold">{step.title}</h3>
                        <span className="bg-muted-background text-muted rounded-full px-2.5 py-1 text-xs font-medium">
                          {stepKindLabels[step.stepKind]}
                        </span>
                      </div>
                      <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-line">
                        {step.guidance}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        Status saat ini: {stepStatusLabels[step.status]}
                      </p>
                    </div>
                  </div>
                  <StepStatusSelect
                    caseId={detail.id}
                    workflowStepId={step.id}
                    initialStatus={step.status}
                    label={`Status langkah ${step.title}`}
                    disabled={isArchived}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Alert>Belum ada langkah pada versi ini.</Alert>
        )}
      </section>

      <section aria-labelledby="kanal-heading" className="space-y-3">
        <div>
          <h2 id="kanal-heading" className="text-xl font-semibold">
            Kanal resmi
          </h2>
          <p className="text-muted mt-1 text-sm">
            Pengajuan dilakukan di kanal instansi, bukan di URUSIN.
          </p>
        </div>
        {detail.handoffs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.handoffs.map((handoff) => (
              <Card key={handoff.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="bg-accent text-accent-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    {handoff.channelType === "PHYSICAL" ? (
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <CardTitle className="text-base">{handoff.label}</CardTitle>
                    <CardDescription>
                      {channelTypeLabels[handoff.channelType]} · {hostname(handoff.officialUrl)}
                    </CardDescription>
                  </div>
                </div>
                {handoff.caveat ? (
                  <p className="text-muted text-sm leading-6">{handoff.caveat}</p>
                ) : null}
                <a
                  href={handoff.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
                >
                  Buka kanal resmi
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">(buka di tab baru)</span>
                </a>
              </Card>
            ))}
          </div>
        ) : (
          <Alert variant="warning">
            Belum ada kanal resmi yang dapat ditampilkan untuk versi ini.
          </Alert>
        )}
      </section>

      <section aria-labelledby="tindakan-heading" className="space-y-3">
        <h2 id="tindakan-heading" className="text-xl font-semibold">
          Tindakan pengurusan
        </h2>
        <div className="flex flex-wrap gap-2">
          {!isArchived ? (
            <>
              <form action={markCaseDoneAction.bind(null, detail.id)}>
                <Button type="submit" variant="outline">
                  Tandai selesai (pribadi)
                </Button>
              </form>
              <form action={archiveCaseAction.bind(null, detail.id)}>
                <Button type="submit" variant="outline">
                  Arsipkan
                </Button>
              </form>
            </>
          ) : null}
          <form action={deleteCaseAction.bind(null, detail.id)}>
            <ConfirmDeleteButton message="Hapus pengurusan ini? Data progres akan dihapus dari tampilan.">
              Hapus pengurusan
            </ConfirmDeleteButton>
          </form>
        </div>
        <p className="text-muted text-xs">
          Tindakan ini hanya mengubah catatan Anda di URUSIN, bukan status instansi.
        </p>
      </section>
    </div>
  );
}
