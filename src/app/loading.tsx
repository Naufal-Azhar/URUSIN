export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>
      <div className="bg-muted-background h-8 w-48 animate-pulse rounded" />
      <div className="bg-muted-background h-24 animate-pulse rounded-xl" />
      <div className="bg-muted-background h-24 animate-pulse rounded-xl" />
    </div>
  );
}
