import Link from "next/link";
import { FileText, LayoutDashboard, LogIn } from "lucide-react";
import { getSession } from "@/modules/auth/guards";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 rounded-md py-1">
          <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">URUSIN</span>
            <span className="text-muted block text-xs">Urusan publik, jadi lebih gampang</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            href="/layanan"
            className="text-foreground hover:bg-muted-background rounded-md px-3 py-2 font-medium"
          >
            Layanan
          </Link>
          <Link
            href="/laporkan"
            className="text-foreground hover:bg-muted-background rounded-md px-3 py-2 font-medium"
          >
            Laporkan
          </Link>
          <Link
            href="/tentang"
            className="text-foreground hover:bg-muted-background rounded-md px-3 py-2 font-medium"
          >
            Tentang
          </Link>
          {session?.user ? (
            <>
              {session.user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="text-foreground hover:bg-muted-background rounded-md px-3 py-2 font-medium"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="bg-primary text-primary-foreground hover:bg-primary-hover ml-1 inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-semibold"
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/masuk"
              className="bg-primary text-primary-foreground hover:bg-primary-hover ml-1 inline-flex items-center gap-1.5 rounded-md px-3 py-2 font-semibold"
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
