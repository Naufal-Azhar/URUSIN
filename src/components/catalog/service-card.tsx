import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { CatalogItem } from "@/modules/catalog/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function ServiceCard({ service }: { service: CatalogItem }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-1">
          {service.category.name}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
          <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Terverifikasi
        </span>
      </div>

      <div className="mt-3 flex-1">
        <p className="text-muted text-xs font-medium">{service.code}</p>
        <CardTitle className="mt-1">
          <Link href={`/layanan/${service.slug}`} className="hover:underline">
            {service.title}
          </Link>
        </CardTitle>
        <CardDescription>{service.summary}</CardDescription>
      </div>

      <div className="border-border text-muted mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs">
        <span>
          Diverifikasi {formatDate(service.verifiedAt)} · Versi {service.versionNumber}
        </span>
        <Link
          href={`/layanan/${service.slug}`}
          className="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
        >
          Detail
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
