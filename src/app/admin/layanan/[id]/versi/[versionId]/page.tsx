import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { VersionStatusBadge } from "@/components/admin/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import {
  addHandoffAction,
  addRequirementAction,
  addSourceAction,
  addStepAction,
  archiveVersionAction,
  deleteHandoffAction,
  deleteRequirementAction,
  deleteStepAction,
  markVerifiedAction,
  publishVersionAction,
  rejectVersionAction,
  removeSourceAction,
  submitVersionAction,
  updateVersionAction,
} from "@/modules/admin/actions";
import { revisionActionLabels } from "@/modules/admin/labels";
import { getAdminVersionDetail } from "@/modules/admin/queries";
import { channelTypeLabels, stepKindLabels } from "@/modules/catalog/labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Editor versi",
};

type PageProps = {
  params: Promise<{ id: string; versionId: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
};

function ChecklistItem({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ready ? (
        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <XCircle aria-hidden="true" className="text-danger mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className={ready ? "text-foreground" : "text-muted"}>{children}</span>
    </li>
  );
}

export default async function AdminVersionEditorPage({ params, searchParams }: PageProps) {
  const [{ id, versionId }, query] = await Promise.all([params, searchParams]);
  const version = await getAdminVersionDetail(versionId);

  if (!version || version.serviceId !== id) notFound();

  const editable = version.status === "DRAFT" || version.status === "IN_REVIEW";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          href={`/admin/layanan/${id}`}
          className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke layanan
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1">
            {version.service.category.name}
          </span>
          <VersionStatusBadge status={version.status} />
          <span className="bg-muted-background text-muted rounded-full px-2.5 py-1">
            Versi {version.versionNumber}
          </span>
        </div>
        <div>
          <p className="text-muted text-sm">{version.service.code}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{version.service.title}</h1>
        </div>
      </header>

      <AdminNotice msg={query.msg} error={query.err} />

      {!editable ? (
        <Alert variant="warning">
          Versi berstatus {version.status === "PUBLISHED" ? "terbit" : "diarsipkan"} dan tidak dapat
          diubah. Buat versi baru untuk perubahan konten.
        </Alert>
      ) : null}

      <Card>
        <CardTitle>Kesiapan publish</CardTitle>
        <CardDescription>
          Semua syarat berikut harus terpenuhi sebelum tombol publish berhasil.
        </CardDescription>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <ChecklistItem ready={version.sources.length > 0}>
            Minimal satu sumber resmi
          </ChecklistItem>
          <ChecklistItem ready={Boolean(version.verifiedAt && version.verifiedById)}>
            Sudah ditandai terverifikasi
          </ChecklistItem>
          <ChecklistItem ready={version.requirements.length > 0}>
            Minimal satu persyaratan
          </ChecklistItem>
          <ChecklistItem ready={version.steps.length > 0}>Minimal satu langkah</ChecklistItem>
          <ChecklistItem ready={version.handoffs.length > 0}>
            Minimal satu handoff resmi
          </ChecklistItem>
        </ul>
        {version.verifiedAt ? (
          <p className="text-muted mt-3 text-xs">
            Diverifikasi {formatDate(version.verifiedAt)} oleh {version.verifiedBy?.name ?? "Admin"}
            .
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Konten versi</CardTitle>
        <CardDescription>
          Ringkasan dan catatan kelayakan yang tampil di halaman publik.
        </CardDescription>
        {editable ? (
          <form action={updateVersionAction.bind(null, id, versionId)} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Ringkasan prosedur</Label>
              <Textarea
                id="summary"
                name="summary"
                required
                minLength={20}
                maxLength={5000}
                defaultValue={version.summary}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eligibilityNote">Catatan kelayakan (opsional)</Label>
              <Textarea
                id="eligibilityNote"
                name="eligibilityNote"
                maxLength={2000}
                defaultValue={version.eligibilityNote ?? ""}
              />
            </div>
            <Button type="submit">Simpan ringkasan</Button>
          </form>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <p className="whitespace-pre-line">{version.summary}</p>
            {version.eligibilityNote ? (
              <p className="text-muted whitespace-pre-line">{version.eligibilityNote}</p>
            ) : null}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Alur editorial</CardTitle>
        <CardDescription>
          Draft → review → publish. Publish akan mengarsipkan versi terbit sebelumnya.
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {editable && !version.verifiedAt ? (
            <form action={markVerifiedAction.bind(null, id, versionId)}>
              <Button type="submit" variant="outline">
                Tandai terverifikasi
              </Button>
            </form>
          ) : null}

          {version.status === "DRAFT" ? (
            <form action={submitVersionAction.bind(null, id, versionId)}>
              <Button type="submit">Kirim untuk review</Button>
            </form>
          ) : null}

          {version.status === "IN_REVIEW" ? (
            <>
              <form action={rejectVersionAction.bind(null, id, versionId)}>
                <Button type="submit" variant="outline">
                  Kembalikan ke draft
                </Button>
              </form>
              <form action={publishVersionAction.bind(null, id, versionId)}>
                <Button type="submit">Publikasikan</Button>
              </form>
            </>
          ) : null}

          {version.status === "PUBLISHED" ? (
            <form action={archiveVersionAction.bind(null, id, versionId)}>
              <Button type="submit" variant="outline">
                Arsipkan versi
              </Button>
            </form>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardTitle>Persyaratan</CardTitle>
        <CardDescription>Item checklist yang akan tampil di halaman layanan.</CardDescription>
        {version.requirements.length === 0 ? (
          <Alert variant="warning" className="mt-4">
            Belum ada persyaratan.
          </Alert>
        ) : (
          <ul className="mt-4 space-y-3">
            {version.requirements.map((requirement) => (
              <li key={requirement.id} className="border-border rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{requirement.title}</p>
                    <p className="text-muted text-xs">
                      {requirement.isRequired ? "Wajib" : "Kondisional"}
                    </p>
                  </div>
                  {editable ? (
                    <form
                      action={deleteRequirementAction.bind(null, id, versionId, requirement.id)}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Hapus
                      </Button>
                    </form>
                  ) : null}
                </div>
                <p className="text-muted mt-2 text-sm whitespace-pre-line">
                  {requirement.guidance}
                </p>
                {requirement.conditionNote ? (
                  <p className="mt-1 text-xs">Kondisi: {requirement.conditionNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {editable ? (
          <form
            action={addRequirementAction.bind(null, id, versionId)}
            className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="requirementTitle">Judul persyaratan</Label>
              <Input id="requirementTitle" name="title" required maxLength={160} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="isRequired"
                name="isRequired"
                type="checkbox"
                defaultChecked
                className="text-primary h-5 w-5 rounded border-gray-300"
              />
              <Label htmlFor="isRequired">Wajib</Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="requirementGuidance">Panduan persyaratan</Label>
              <Textarea
                id="requirementGuidance"
                name="guidance"
                required
                minLength={5}
                maxLength={2000}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="conditionNote">Catatan kondisi (opsional)</Label>
              <Input id="conditionNote" name="conditionNote" maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline">
                Tambah persyaratan
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Langkah</CardTitle>
        <CardDescription>Tahapan mandiri yang dapat ditandai warga.</CardDescription>
        {version.steps.length === 0 ? (
          <Alert variant="warning" className="mt-4">
            Belum ada langkah.
          </Alert>
        ) : (
          <ol className="mt-4 space-y-3">
            {version.steps.map((step) => (
              <li key={step.id} className="border-border rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-muted text-xs">{stepKindLabels[step.stepKind]}</p>
                  </div>
                  {editable ? (
                    <form action={deleteStepAction.bind(null, id, versionId, step.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Hapus
                      </Button>
                    </form>
                  ) : null}
                </div>
                <p className="text-muted mt-2 text-sm whitespace-pre-line">{step.guidance}</p>
              </li>
            ))}
          </ol>
        )}

        {editable ? (
          <form
            action={addStepAction.bind(null, id, versionId)}
            className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="stepTitle">Judul langkah</Label>
              <Input id="stepTitle" name="title" required maxLength={160} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepKind">Jenis langkah</Label>
              <Select id="stepKind" name="stepKind" defaultValue="PREPARE">
                {Object.entries(stepKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="stepGuidance">Panduan langkah</Label>
              <Textarea id="stepGuidance" name="guidance" required minLength={5} maxLength={2000} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline">
                Tambah langkah
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Sumber resmi</CardTitle>
        <CardDescription>Minimal satu sumber diperlukan untuk publish.</CardDescription>
        {version.sources.length === 0 ? (
          <Alert variant="warning" className="mt-4">
            Belum ada sumber resmi.
          </Alert>
        ) : (
          <ul className="mt-4 space-y-3">
            {version.sources.map((versionSource) => (
              <li
                key={versionSource.officialSourceId}
                className="border-border rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{versionSource.officialSource.title}</p>
                    <p className="text-muted text-xs">
                      {versionSource.officialSource.agencyName} ·{" "}
                      {formatDate(versionSource.officialSource.lastCheckedAt)}
                    </p>
                    <a
                      href={versionSource.officialSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-1 inline-flex text-xs font-medium hover:underline"
                    >
                      {versionSource.officialSource.url}
                    </a>
                  </div>
                  {editable ? (
                    <form
                      action={removeSourceAction.bind(
                        null,
                        id,
                        versionId,
                        versionSource.officialSourceId,
                      )}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        Lepas
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        {editable ? (
          <form
            action={addSourceAction.bind(null, id, versionId)}
            className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="agencyName">Nama instansi</Label>
              <Input id="agencyName" name="agencyName" required maxLength={160} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceTitle">Judul sumber</Label>
              <Input id="sourceTitle" name="title" required maxLength={200} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sourceUrl">URL sumber</Label>
              <Input
                id="sourceUrl"
                name="url"
                type="url"
                required
                placeholder="https://example.com/sumber"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastCheckedAt">Tanggal pemeriksaan</Label>
              <Input id="lastCheckedAt" name="lastCheckedAt" type="date" defaultValue={today} />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" variant="outline">
                Tambah sumber
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Kanal resmi</CardTitle>
        <CardDescription>
          Handoff ke instansi. Domain harus ada di `OFFICIAL_DOMAIN_ALLOWLIST`.
        </CardDescription>
        {version.handoffs.length === 0 ? (
          <Alert variant="warning" className="mt-4">
            Belum ada kanal resmi.
          </Alert>
        ) : (
          <ul className="mt-4 space-y-3">
            {version.handoffs.map((handoff) => (
              <li key={handoff.id} className="border-border rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{handoff.label}</p>
                    <p className="text-muted text-xs">{channelTypeLabels[handoff.channelType]}</p>
                    <a
                      href={handoff.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-1 inline-flex text-xs font-medium hover:underline"
                    >
                      {handoff.officialUrl}
                    </a>
                  </div>
                  {editable ? (
                    <form action={deleteHandoffAction.bind(null, id, versionId, handoff.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Hapus
                      </Button>
                    </form>
                  ) : null}
                </div>
                {handoff.caveat ? (
                  <p className="text-muted mt-2 text-sm">{handoff.caveat}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {editable ? (
          <form
            action={addHandoffAction.bind(null, id, versionId)}
            className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="handoffLabel">Label kanal</Label>
              <Input id="handoffLabel" name="label" required maxLength={160} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelType">Jenis kanal</Label>
              <Select id="channelType" name="channelType" defaultValue="WEB">
                {Object.entries(channelTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="officialUrl">URL kanal</Label>
              <Input
                id="officialUrl"
                name="officialUrl"
                type="url"
                required
                placeholder="https://example.com/kanal"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="caveat">Catatan kanal (opsional)</Label>
              <Input id="caveat" name="caveat" maxLength={1000} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline">
                Tambah kanal
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Riwayat editorial</CardTitle>
        <CardDescription>20 revisi terakhir untuk versi ini.</CardDescription>
        {version.revisions.length === 0 ? (
          <p className="text-muted mt-3 text-sm">Belum ada revisi.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {version.revisions.map((revision) => (
              <li key={revision.id} className="border-border flex flex-wrap gap-2 border-b pb-2">
                <span className="font-medium">{revisionActionLabels[revision.action]}</span>
                <span className="text-muted">
                  {formatDate(revision.createdAt)} · {revision.author.name ?? "Admin"}
                  {revision.reviewer ? ` · reviewer: ${revision.reviewer.name ?? "Admin"}` : ""}
                </span>
                {revision.note ? <span className="text-muted">— {revision.note}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
