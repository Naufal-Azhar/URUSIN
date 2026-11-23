import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "URUSIN — Urusan Publik, Jadi Lebih Gampang",
    template: "%s | URUSIN",
  },
  description:
    "Pendamping persiapan pengurusan KTP, KK, dan SIM untuk warga Batam. Bukan situs resmi pemerintah.",
  applicationName: "URUSIN",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#konten" className="skip-link">
          Lewati ke konten utama
        </a>
        <SiteHeader />
        <main id="konten" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
