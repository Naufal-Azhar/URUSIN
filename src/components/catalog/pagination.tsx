import Link from "next/link";

type PaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params?: Record<string, string | undefined>;
};

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, total, pageSize, basePath, params = {} }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Navigasi halaman" className="flex items-center justify-between gap-4 pt-2">
      {page > 1 ? (
        <Link
          href={buildHref(basePath, params, page - 1)}
          className="border-border hover:bg-muted-background rounded-md border bg-white px-3 py-2 text-sm font-semibold"
        >
          Sebelumnya
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      <p className="text-muted text-sm">
        Halaman {page} dari {totalPages}
      </p>

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, params, page + 1)}
          className="border-border hover:bg-muted-background rounded-md border bg-white px-3 py-2 text-sm font-semibold"
        >
          Berikutnya
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
