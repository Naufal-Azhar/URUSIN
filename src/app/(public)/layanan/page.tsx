import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/catalog/pagination";
import { ServiceCard } from "@/components/catalog/service-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogCategorySchema, normalizePage } from "@/modules/catalog/schemas";
import { listPublishedServices } from "@/modules/catalog/queries";
import { searchPublishedServices } from "@/modules/catalog/search";

const categories = [
  { slug: "ktp", name: "KTP" },
  { slug: "kk", name: "Kartu Keluarga" },
  { slug: "sim", name: "SIM" },
];

type LayananPageProps = {
  searchParams: Promise<{ q?: string; kategori?: string; page?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Layanan",
};

function categoryHref(slug: string, query: string) {
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (slug) search.set("kategori", slug);
  const value = search.toString();
  return value ? `/layanan?${value}` : "/layanan";
}

export default async function LayananPage({ searchParams }: LayananPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const categoryResult = catalogCategorySchema.safeParse(params.kategori);
  const category = categoryResult.success ? categoryResult.data : "";
  const page = normalizePage(params.page);
  const searchTooShort = query.length > 0 && query.length < 2;

  const result =
    query.length >= 2
      ? await searchPublishedServices({
          query,
          category: category || undefined,
          page,
        })
      : await listPublishedServices({
          category: category || undefined,
          page,
        });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Layanan</h1>
        <p className="text-muted max-w-2xl text-sm leading-6">
          Cari layanan berdasarkan masalah atau kata sehari-hari. Hasil hanya menampilkan panduan
          yang sudah diverifikasi dan dipublikasikan.
        </p>
      </header>

      <form action="/layanan" method="get" className="max-w-2xl">
        <label htmlFor="q" className="sr-only">
          Cari layanan
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Contoh: KTP hilang"
            autoComplete="off"
            maxLength={80}
          />
          <Button type="submit">
            <Search aria-hidden="true" className="h-4 w-4" />
            Cari
          </Button>
        </div>
        {category ? <input type="hidden" name="kategori" value={category} /> : null}
      </form>

      <nav aria-label="Filter kategori" className="flex flex-wrap gap-2">
        <Link
          href={categoryHref("", query)}
          aria-current={!category ? "page" : undefined}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            !category
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border text-foreground hover:bg-muted-background bg-white"
          }`}
        >
          Semua
        </Link>
        {categories.map((item) => (
          <Link
            key={item.slug}
            href={categoryHref(item.slug, query)}
            aria-current={category === item.slug ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              category === item.slug
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-foreground hover:bg-muted-background bg-white"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {searchTooShort ? (
        <Alert variant="warning">Masukkan minimal 2 karakter untuk mencari.</Alert>
      ) : null}

      {result.total === 0 ? (
        <Alert variant="warning">
          {query
            ? `Tidak ada layanan terverifikasi yang cocok dengan “${query}”. Coba kata lain, gunakan sinonim, atau pilih kategori.`
            : "Belum ada layanan terverifikasi untuk ditampilkan. Admin harus menautkan sumber resmi, menetapkan tanggal pemeriksaan, dan mempublikasikan versi sebelum layanan muncul di sini."}
        </Alert>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-muted text-sm" aria-live="polite">
            {query
              ? `${result.total} layanan ditemukan untuk “${query}”.`
              : `${result.total} layanan terverifikasi.`}
          </p>
          {result.total > result.pageSize ? (
            <p className="text-muted text-xs">Gunakan navigasi halaman di bawah.</p>
          ) : null}
        </div>
      )}

      {result.total > 0 ? (
        <section aria-label="Hasil layanan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </section>
      ) : (
        <div className="border-border rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="text-muted text-sm">
            Coba kata yang lebih umum, misalnya “KTP hilang”, “buat KK”, atau “perpanjang SIM”.
          </p>
          <Link
            href="/"
            className="text-primary mt-3 inline-flex text-sm font-semibold hover:underline"
          >
            Kembali ke beranda
          </Link>
        </div>
      )}

      <Pagination
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        basePath="/layanan"
        params={{ q: query || undefined, kategori: category || undefined }}
      />
    </div>
  );
}
