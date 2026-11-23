import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAdmin } from "@/modules/auth/guards";

export const dynamic = "force-dynamic";

const adminNav = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/layanan", label: "Layanan" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/audit", label: "Audit" },
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="border-border rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">Area admin</p>
            <p className="text-muted text-sm">
              Kurasi konten, verifikasi sumber, triage laporan, dan audit perubahan.
            </p>
          </div>
          <nav aria-label="Navigasi admin" className="flex flex-wrap items-center gap-1 text-sm">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-muted-background rounded-md px-3 py-2 font-medium"
              >
                {item.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
