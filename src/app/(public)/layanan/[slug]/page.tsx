import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarCheck, ExternalLink, FileText, MapPin } from "lucide-react";
import { StartCaseForm } from "@/components/cases/start-case-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getSession } from "@/modules/auth/guards";
import { channelTypeLabels, stepKindLabels } from "@/modules/catalog/labels";
import { getPublishedServiceBySlug } from "@/modules/catalog/queries";

type DetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail layanan",
};

function hostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function DetailLayananPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const service = await getPublishedServiceBySlug(slug);

  if (!service) notFound();

  const session = await getSession();
  const loginHref = `/masuk?callbackUrl=${encodeURIComponent(`/layanan/${service.slug}`)}`;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/layanan"
          className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke layanan
        </Link>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1">
            {service.category.name}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
            <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Terverifikasi
          </span>
          <span className="bg-muted-background text-muted rounded-full px-2.5 py-1">
            Versi {service.versionNumber}
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-muted text-sm font-medium">{service.code}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{service.title}</h1>
          <p className="text-muted max-w-3xl text-sm leading-7">{service.summary}</p>
        </div>
        <p className="text-muted flex flex-wrap items-center gap-2 text-sm">
          <CalendarCheck aria-hidden="true" className="text-primary h-4 w-4" />
          Diverifikasi {formatDate(service.verifiedAt)} oleh{" "}
          {service.verifiedByName ?? "Tim kurasi URUSIN"}
        </p>
      </header>

      <Alert variant="warning">
        Ini panduan persiapan mandiri, bukan dokumen resmi dan bukan status instansi. URUSIN tidak
        mengajukan permohonan atas nama Anda. Periksa kembali kanal resmi sebelum datang atau
        mengajukan.
      </Alert>

      {service.eligibilityNote ? (
        <section aria-labelledby="kelayakan-heading" className="space-y-2">
          <h2 id="kelayakan-heading" className="text-xl font-semibold">
            Catatan kelayakan
          </h2>
          <p className="text-muted text-sm leading-7 whitespace-pre-line">
            {service.eligibilityNote}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="kanal-resmi-heading" className="space-y-3">
        <div>
          <h2 id="kanal-resmi-heading" className="text-xl font-semibold">
            Lanjutkan ke kanal resmi
          </h2>
          <p className="text-muted mt-1 text-sm">
            Pengajuan sebenarnya dilakukan di kanal instansi, bukan di URUSIN.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {service.handoffs.map((handoff) => (
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
      </section>

      <section aria-labelledby="persyaratan-heading" className="space-y-3">
        <div>
          <h2 id="persyaratan-heading" className="text-xl font-semibold">
            Persyaratan
          </h2>
          <p className="text-muted mt-1 text-sm">
            Periksa kondisi Anda; sebagian persyaratan mungkin hanya berlaku pada kondisi tertentu.
          </p>
        </div>
        {service.requirements.length > 0 ? (
          <ol className="space-y-3">
            {service.requirements.map((requirement) => (
              <li key={requirement.id} className="border-border rounded-xl border bg-white p-4">
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
              </li>
            ))}
          </ol>
        ) : (
          <Alert>Belum ada rincian persyaratan pada versi ini.</Alert>
        )}
      </section>

      <section aria-labelledby="tahapan-heading" className="space-y-3">
        <div>
          <h2 id="tahapan-heading" className="text-xl font-semibold">
            Tahapan
          </h2>
          <p className="text-muted mt-1 text-sm">
            Tahapan ini membantu persiapan. Status resmi tetap ditentukan instansi.
          </p>
        </div>
        {service.steps.length > 0 ? (
          <ol className="space-y-3">
            {service.steps.map((step, index) => (
              <li key={step.id} className="border-border flex gap-3 rounded-xl border bg-white p-4">
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
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Alert>Belum ada rincian tahapan pada versi ini.</Alert>
        )}
      </section>

      <section aria-labelledby="sumber-heading" className="space-y-3">
        <div>
          <h2 id="sumber-heading" className="text-xl font-semibold">
            Sumber resmi
          </h2>
          <p className="text-muted mt-1 text-sm">
            Sumber yang diperiksa admin sebelum versi ini dipublikasikan.
          </p>
        </div>
        <ul className="space-y-3">
          {service.sources.map((source) => (
            <li key={source.id} className="border-border rounded-xl border bg-white p-4">
              <div className="flex items-start gap-3">
                <FileText aria-hidden="true" className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    {source.title}
                    <span className="sr-only"> (buka di tab baru)</span>
                  </a>
                  <p className="text-muted mt-1 text-sm">
                    {source.agencyName} · dicek {formatDate(source.lastCheckedAt)}
                  </p>
                  {source.evidenceNote ? (
                    <p className="text-muted mt-2 text-sm leading-6">{source.evidenceNote}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardTitle>Simpan progres persiapan</CardTitle>
        <CardDescription>
          Buat pengurusan dari panduan versi ini. Checklist dan langkah dapat Anda tandai sendiri;
          status instansi tetap ditentukan pemerintah.
        </CardDescription>
        <div className="mt-4">
          {session?.user ? (
            <div className="space-y-3">
              <StartCaseForm slug={service.slug} />
              <Link
                href="/dashboard"
                className="text-primary inline-flex text-sm font-semibold hover:underline"
              >
                Buka dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild>
                <Link href={loginHref}>Masuk untuk menyimpan progres</Link>
              </Button>
              <p className="text-muted text-sm">
                Tanpa akun, Anda tetap dapat membaca panduan ini.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
