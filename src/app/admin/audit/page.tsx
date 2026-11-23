import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/format";
import { auditActionLabels } from "@/modules/admin/labels";
import { listAdminAuditEvents } from "@/modules/admin/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Audit",
};

export default async function AdminAuditPage() {
  const events = await listAdminAuditEvents();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit</h1>
        <p className="text-muted text-sm leading-6">
          Jejak tindakan administratif. Tidak berisi email, token, isi laporan, atau data pribadi
          sensitif.
        </p>
      </header>

      {events.length === 0 ? (
        <Alert>Belum ada event audit.</Alert>
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border bg-white">
          <table className="divide-border min-w-full divide-y text-sm">
            <caption className="sr-only">Daftar event audit</caption>
            <thead className="bg-muted-background text-muted text-left text-xs uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Waktu
                </th>
                <th scope="col" className="px-4 py-3">
                  Aktor
                </th>
                <th scope="col" className="px-4 py-3">
                  Aksi
                </th>
                <th scope="col" className="px-4 py-3">
                  Entitas
                </th>
                <th scope="col" className="px-4 py-3">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="text-muted px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(event.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs">{event.actor?.name ?? "Sistem/CLI"}</td>
                  <td className="px-4 py-3 text-xs">{auditActionLabels[event.action]}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium">{event.entityType}</span>
                    <span className="text-muted block font-mono text-[10px]">{event.entityId}</span>
                  </td>
                  <td className="text-muted px-4 py-3 text-xs">{event.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
