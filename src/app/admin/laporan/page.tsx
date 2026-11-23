import { AdminNotice } from "@/components/admin/admin-notice";
import { ReportStatusBadge } from "@/components/admin/status-badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { setReportStatusAction } from "@/modules/admin/actions";
import { allowedReportNextStatuses, reportStatusLabels } from "@/modules/admin/labels";
import { listAdminReports } from "@/modules/admin/queries";
import { reportIssueTypeLabels } from "@/modules/reports/schemas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Laporan",
};

type PageProps = {
  searchParams: Promise<{ msg?: string; err?: string }>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reports = await listAdminReports();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Laporan informasi</h1>
        <p className="text-muted text-sm leading-6">
          Triase laporan tanpa menampilkan identitas pelapor. Setiap perubahan status dicatat di
          audit.
        </p>
      </header>

      <AdminNotice msg={params.msg} error={params.err} />

      {reports.length === 0 ? (
        <Alert>Belum ada laporan.</Alert>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const nextStatuses = allowedReportNextStatuses[report.status];
            return (
              <article
                key={report.id}
                className="border-border rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ReportStatusBadge status={report.status} />
                      <span className="bg-muted-background text-muted rounded-full px-2.5 py-1 text-xs font-medium">
                        {reportIssueTypeLabels[report.issueType]}
                      </span>
                      <span className="text-muted text-xs">
                        {report.reporterId ? "Pelapor terdaftar" : "Pelapor tamu"}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base">{report.service.title}</CardTitle>
                    <CardDescription>
                      {report.service.code} · {formatDate(report.createdAt)}
                    </CardDescription>
                  </div>
                </div>

                <p className="text-muted mt-3 text-sm whitespace-pre-line">{report.message}</p>

                {nextStatuses.length > 0 ? (
                  <form
                    action={setReportStatusAction.bind(null, report.id)}
                    className="mt-4 flex flex-wrap items-end gap-2"
                  >
                    <div className="space-y-1">
                      <label htmlFor={`status-${report.id}`} className="text-xs font-medium">
                        Status laporan
                      </label>
                      <Select
                        id={`status-${report.id}`}
                        name="status"
                        defaultValue={nextStatuses[0]}
                        className="h-9 w-48 text-sm"
                      >
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {reportStatusLabels[status]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button type="submit" size="sm">
                      Perbarui status
                    </Button>
                  </form>
                ) : (
                  <p className="text-muted mt-3 text-xs">Tidak ada transisi status lanjutan.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
