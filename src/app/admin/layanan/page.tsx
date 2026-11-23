import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { VersionStatusBadge } from "@/components/admin/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { createServiceAction } from "@/modules/admin/actions";
import { listAdminCategories, listAdminServices } from "@/modules/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Layanan",
};

type PageProps = {
  searchParams: Promise<{ msg?: string; err?: string }>;
};

export default async function AdminServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [services, categories] = await Promise.all([listAdminServices(), listAdminCategories()]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Layanan</h1>
        <p className="text-muted text-sm leading-6">
          Buat identitas layanan, lalu lengkapi versi draft sebelum review dan publish.
        </p>
      </header>

      <AdminNotice msg={params.msg} error={params.err} />

      <Card>
        <CardTitle>Buat layanan baru</CardTitle>
        <CardDescription>
          Kode dan slug harus unik. Layanan baru otomatis memiliki versi 1 berstatus draft.
        </CardDescription>
        <form action={createServiceAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Kategori</Label>
            <Select id="categoryId" name="categoryId" required defaultValue="">
              <option value="" disabled>
                Pilih kategori
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Kode</Label>
            <Input id="code" name="code" required placeholder="KTP-01" maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required placeholder="ktp-el-pertama" maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Perekaman KTP-el pertama kali"
              maxLength={160}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Buat layanan</Button>
          </div>
        </form>
      </Card>

      {services.length === 0 ? (
        <Alert variant="warning">Belum ada layanan. Buat layanan pertama di atas.</Alert>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border bg-white">
          <table className="divide-border min-w-full divide-y text-sm">
            <caption className="sr-only">Daftar layanan</caption>
            <thead className="bg-muted-background text-muted text-left text-xs uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Kode
                </th>
                <th scope="col" className="px-4 py-3">
                  Judul
                </th>
                <th scope="col" className="px-4 py-3">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3">
                  Versi
                </th>
                <th scope="col" className="px-4 py-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="text-foreground px-4 py-3 font-medium">{service.code}</td>
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium">{service.title}</p>
                    <p className="text-muted text-xs">{service.slug}</p>
                  </td>
                  <td className="text-muted px-4 py-3">{service.category.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {service.versions.map((version) => (
                        <span
                          key={version.id}
                          className="text-muted inline-flex items-center gap-1 text-xs"
                        >
                          v{version.versionNumber}
                          <VersionStatusBadge status={version.status} />
                          {version.publishedAt ? (
                            <span className="text-muted">{formatDate(version.publishedAt)}</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/layanan/${service.id}`}
                      className="text-primary font-semibold hover:underline"
                    >
                      Kelola
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
