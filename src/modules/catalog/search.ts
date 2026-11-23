import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { officialDomainAllowlist } from "@/lib/env";
import { logError } from "@/lib/logger";
import { isAllowedOfficialUrl } from "@/lib/security";
import type { CatalogItem, CatalogPage } from "./types";

const PAGE_SIZE = 12;
const MAX_SEARCH_ROWS = 100;

type SearchRow = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string;
  verified_at: Date;
  version_id: string;
  version_number: number;
  category_name: string;
  category_slug: string;
  rank: number;
};

export async function searchPublishedServices(input: {
  query: string;
  category?: string;
  page?: number;
}): Promise<CatalogPage> {
  const query = input.query.trim();
  const page = input.page ?? 1;
  if (query.length === 0) {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  const categoryClause = input.category
    ? Prisma.sql`AND c.slug = ${input.category}`
    : Prisma.sql`AND TRUE`;

  let rows: SearchRow[];

  try {
    rows = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      WITH published AS (
        SELECT DISTINCT ON (sv.service_id)
          sv.id,
          sv.service_id,
          sv.version_number,
          sv.summary,
          sv.verified_at
        FROM "ServiceVersion" sv
        WHERE sv.status = 'PUBLISHED'
          AND sv.verified_at IS NOT NULL
          AND sv.verified_by_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM "VersionSource" vs
            WHERE vs.service_version_id = sv.id
          )
          AND EXISTS (
            SELECT 1 FROM "OfficialHandoff" oh
            WHERE oh.service_version_id = sv.id
          )
        ORDER BY sv.service_id, sv.published_at DESC NULLS LAST, sv.version_number DESC
      ),
      ranked AS (
        SELECT
          s.id,
          s.code,
          s.slug,
          s.title,
          p.summary,
          p.verified_at,
          p.id AS version_id,
          p.version_number,
          c.name AS category_name,
          c.slug AS category_slug,
          CASE
            WHEN lower(s.code) = lower(${query})
              OR lower(s.slug) = lower(${query})
              OR lower(s.title) = lower(${query}) THEN 100
            WHEN EXISTS (
              SELECT 1 FROM "ServiceAlias" a
              WHERE a.service_id = s.id AND lower(a.phrase) = lower(${query})
            ) THEN 80
            WHEN s.title ILIKE '%' || ${query} || '%' THEN 60
            WHEN to_tsvector('indonesian', s.title || ' ' || p.summary)
              @@ websearch_to_tsquery('indonesian', ${query}) THEN 50
            WHEN similarity(s.title, ${query}) > 0.25 THEN 30
            WHEN EXISTS (
              SELECT 1 FROM "ServiceAlias" a
              WHERE a.service_id = s.id AND a.phrase % ${query}
            ) THEN 20
            ELSE 0
          END AS rank
        FROM "Service" s
        JOIN "ServiceCategory" c ON c.id = s.category_id
        JOIN published p ON p.service_id = s.id
        WHERE s.lifecycle_status = 'ACTIVE'
        ${categoryClause}
      )
      SELECT * FROM ranked
      WHERE rank > 0
      ORDER BY rank DESC, title ASC
      LIMIT ${MAX_SEARCH_ROWS}
    `);
  } catch (error) {
    logError("catalog.search.failed", error);
    throw error;
  }

  const versionIds = rows.map((row) => row.version_id);
  const handoffs =
    versionIds.length > 0
      ? await prisma.officialHandoff.findMany({
          where: { serviceVersionId: { in: versionIds } },
          select: { serviceVersionId: true, officialUrl: true },
        })
      : [];

  const validVersionIds = new Set(
    handoffs
      .filter((handoff) => isAllowedOfficialUrl(handoff.officialUrl, officialDomainAllowlist))
      .map((handoff) => handoff.serviceVersionId),
  );

  const items: CatalogItem[] = rows
    .filter((row) => validVersionIds.has(row.version_id))
    .map((row) => ({
      id: row.id,
      code: row.code,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: {
        slug: row.category_slug,
        name: row.category_name,
      },
      verifiedAt: new Date(row.verified_at),
      versionNumber: row.version_number,
    }));

  const start = (page - 1) * PAGE_SIZE;

  return {
    items: items.slice(start, start + PAGE_SIZE),
    total: items.length,
    page,
    pageSize: PAGE_SIZE,
  };
}
