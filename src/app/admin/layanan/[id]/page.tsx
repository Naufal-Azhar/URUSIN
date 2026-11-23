import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";
import { VersionStatusBadge } from "@/components/admin/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { createVersionAction } from "@/modules/admin/actions";
import { getAdminServiceDetail } from "@/modules/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Detail layanan",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
};

export default async function AdminServiceDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const service = await getAdminServiceDetail(id);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          href="/admin/layanan"
          className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke daftar layanan
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-muted text-sm">
          {service.code} · {service.category.name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{service.title}</h1>
        <p className="text-muted text-sm">Slug: {service.slug}</p>
      </header>

      <AdminNotice msg={query.msg} error={query.err} />

      <div className="flex flex-wrap items-center gap-2">
        <form action={createVersionAction.bind(null, service.id)}>
          <Button type="submit">Buat versi draft baru</Button>
        </form>
        <Button asChild variant="outline">
          <Link href={`/layanan/${service.slug}`}>Lihat halaman publik</Link>
        </Button>
      </div>

      {service.versions.length === 0 ? (
        <Alert variant="warning">Belum ada versi untuk layanan ini.</Alert>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border bg-white">
          <table className="divide-border min-w-full divide-y text-sm">
            <caption className="sr-only">Daftar versi layanan</caption>
            <thead className="bg-muted-background text-muted text-left text-xs uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Versi
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Kelengkapan
                </th>
                <th scope="col" className="px-4 py-3">
                  Tanggal
                </th>
                <th scope="col" className="px-4 py-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {service.versions.map((version) => (
                <tr key={version.id}>
                  <td className="text-foreground px-4 py-3 font-medium">
                    v{version.versionNumber}
                  </td>
                  <td className="px-4 py-3">
                    <VersionStatusBadge status={version.status} />
                  </td>
                  <td className="text-muted px-4 py-3 text-xs">
                    {version._count.sources} sumber · {version._count.requirements} syarat ·{" "}
                    {version._count.steps} langkah · {version._count.handoffs} handoff
                  </td>
                  <td className="text-muted px-4 py-3 text-xs">
                    {version.publishedAt
                      ? `Terbit ${formatDate(version.publishedAt)}`
                      : version.verifiedAt
                        ? `Diverifikasi ${formatDate(version.verifiedAt)}`
                        : "Belum diverifikasi"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/layanan/${service.id}/versi/${version.id}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      Buka editor
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
