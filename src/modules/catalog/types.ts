export type CatalogItem = {
  id: string;
  code: string;
  slug: string;
  title: string;
  summary: string;
  category: {
    slug: string;
    name: string;
  };
  verifiedAt: Date;
  versionNumber: number;
};

export type CatalogPage = {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CatalogSource = {
  id: string;
  agencyName: string;
  title: string;
  url: string;
  lastCheckedAt: Date;
  evidenceNote: string | null;
};

export type CatalogRequirement = {
  id: string;
  title: string;
  guidance: string;
  conditionNote: string | null;
  isRequired: boolean;
  sortOrder: number;
};

export type CatalogStep = {
  id: string;
  title: string;
  guidance: string;
  stepKind: "PREPARE" | "VISIT" | "HANDOFF" | "FOLLOWUP";
  sortOrder: number;
};

export type CatalogHandoff = {
  id: string;
  label: string;
  officialUrl: string;
  channelType: "WEB" | "PHYSICAL" | "OTHER";
  caveat: string | null;
};

export type CatalogDetail = CatalogItem & {
  eligibilityNote: string | null;
  verifiedByName: string | null;
  sources: CatalogSource[];
  requirements: CatalogRequirement[];
  steps: CatalogStep[];
  handoffs: CatalogHandoff[];
};
