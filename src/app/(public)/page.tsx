import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categories = [
  {
    slug: "ktp",
    name: "KTP",
    description: "Perekaman pertama, penggantian karena hilang, atau karena rusak.",
  },
  {
    slug: "kk",
    name: "Kartu Keluarga",
    description: "Pembentukan keluarga baru, perubahan data, atau penggantian KK.",
  },
  {
    slug: "sim",
    name: "SIM",
    description: "Perpanjangan SIM A dan SIM C sesuai kebutuhan berkendara.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Panduan persiapan mandiri
        </div>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Urusan publik, jadi lebih gampang.
          </h1>
          <p className="text-muted text-base leading-7 sm:text-lg">
            Temukan layanan KTP, KK, atau SIM, siapkan persyaratan, dan ikuti tahapannya dalam satu
            tempat. Progres yang Anda tandai adalah progres pribadi, bukan status resmi instansi.
          </p>
        </div>

        <form action="/layanan" method="get" className="max-w-2xl">
          <label htmlFor="q" className="sr-only">
            Cari layanan
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Contoh: KTP hilang, buat KK, perpanjang SIM"
              autoComplete="off"
              maxLength={80}
            />
            <Button type="submit" className="sm:w-auto">
              <Search aria-hidden="true" className="h-4 w-4" />
              Cari layanan
            </Button>
          </div>
        </form>

        <Alert variant="warning">
          Katalog masih dalam proses kurasi. Layanan hanya akan tampil setelah sumber resminya
          diperiksa dan diverifikasi oleh admin. URUSIN tidak mengarang persyaratan atau tautan
          resmi.
        </Alert>
      </section>

      <section aria-labelledby="kategori-heading" className="space-y-4">
        <div>
          <h2 id="kategori-heading" className="text-xl font-semibold tracking-tight">
            Pilih kategori
          </h2>
          <p className="text-muted mt-1 text-sm">Mulai dari jenis dokumen yang ingin Anda urus.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.slug} className="flex flex-col">
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
              <Link
                href={`/layanan?kategori=${category.slug}`}
                className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                Lihat layanan
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="cara-kerja-heading" className="space-y-4">
        <h2 id="cara-kerja-heading" className="text-xl font-semibold tracking-tight">
          Cara kerja URUSIN
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            "Cari layanan dengan kata sehari-hari.",
            "Centang persyaratan dan tandai langkah yang sudah Anda siapkan.",
            "Lanjutkan ke kanal resmi pemerintah untuk pengajuan sebenarnya.",
          ].map((text, index) => (
            <li key={text} className="border-border flex gap-3 rounded-xl border bg-white p-4">
              <span className="bg-accent text-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-muted text-sm leading-6">{text}</span>
            </li>
          ))}
        </ol>
        <p className="text-muted flex items-start gap-2 text-sm">
          <CheckCircle2 aria-hidden="true" className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          Tidak perlu mengunggah KTP, KK, SIM, atau dokumen identitas apa pun ke URUSIN.
        </p>
      </section>
    </div>
  );
}
