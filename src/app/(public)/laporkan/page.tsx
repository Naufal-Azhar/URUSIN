import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ReportForm } from "@/components/reports/report-form";
import { listReportableServices } from "@/modules/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporkan informasi",
};

export default async function LaporkanPage() {
  const services = await listReportableServices();

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Laporkan informasi</h1>
        <p className="text-muted text-sm leading-6">
          Bantu kami menjaga katalog tetap akurat. Laporkan tautan rusak, persyaratan yang tidak
          sesuai, atau informasi yang tampak usang.
        </p>
      </header>

      <Alert variant="warning">
        Jangan mengirim NIK, nomor KK/SIM, foto dokumen, atau data pribadi lain melalui laporan.
        URUSIN tidak membutuhkan data tersebut.
      </Alert>

      {services.length === 0 ? (
        <Card>
          <CardTitle>Belum ada layanan yang bisa dilaporkan</CardTitle>
          <CardDescription>
            Formulir aktif setelah ada layanan terverifikasi. Lihat{" "}
            <Link href="/layanan" className="text-primary font-semibold hover:underline">
              halaman layanan
            </Link>{" "}
            untuk status katalog.
          </CardDescription>
        </Card>
      ) : (
        <Card>
          <CardTitle>Formulir laporan</CardTitle>
          <CardDescription>
            Laporan dapat dikirim tanpa akun. Kami tidak meminta identitas pribadi.
          </CardDescription>
          <div className="mt-5">
            <ReportForm services={services} />
          </div>
        </Card>
      )}
    </div>
  );
}
