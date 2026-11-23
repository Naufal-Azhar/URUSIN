import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { VersionStatusBadge } from "@/components/admin/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { publishVersionAction, rejectVersionAction } from "@/modules/admin/actions";
import { listReviewQueue } from "@/modules/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Review",
};

type PageProps = {
  searchParams: Promise<{ msg?: string; err?: string }>;
};

export default async function AdminReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const queue = await listReviewQueue();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review versi</h1>
        <p className="text-muted text-sm leading-6">
          Periksa kelengkapan versi sebelum publish. Publish akan mengarsipkan versi terbit
          sebelumnya.
        </p>
      </header>

      <AdminNotice msg={params.msg} error={params.err} />

      {queue.length === 0 ? (
        <Alert>Belum ada versi yang menunggu review.</Alert>
      ) : (
        <div className="space-y-4">
          {queue.map((version) => (
            <Card key={version.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <VersionStatusBadge status={version.status} />
                    <span className="bg-muted-background text-muted rounded-full px-2.5 py-1 text-xs font-medium">
                      v{version.versionNumber}
                    </span>
                  </div>
                  <CardTitle className="mt-2">{version.service.title}</CardTitle>
                  <CardDescription>
                    {version.service.code} · {version.service.category.name} · dikirim{" "}
                    {formatDate(version.createdAt)}
                  </CardDescription>
                </div>
                <Link
                  href={`/admin/layanan/${version.serviceId}/versi/${version.id}`}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Buka editor
                </Link>
              </div>

              <div className="text-muted mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-foreground font-medium">Sumber</p>
                  <p>{version._count.sources}</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Syarat</p>
                  <p>{version._count.requirements}</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Langkah</p>
                  <p>{version._count.steps}</p>
                </div>
                <div>
                  <p className="text-foreground font-medium">Handoff</p>
                  <p>{version._count.handoffs}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <form action={publishVersionAction.bind(null, version.serviceId, version.id)}>
                  <Button type="submit">Publikasikan</Button>
                </form>
                <form action={rejectVersionAction.bind(null, version.serviceId, version.id)}>
                  <Button type="submit" variant="outline">
                    Kembalikan ke draft
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
