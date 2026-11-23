export type CaseStatus = "IN_PROGRESS" | "USER_MARKED_DONE" | "ARCHIVED";
export type StepStatus = "NOT_STARTED" | "IN_PROGRESS" | "USER_MARKED_DONE";

export type CaseRequirement = {
  id: string;
  title: string;
  guidance: string;
  conditionNote: string | null;
  isRequired: boolean;
  sortOrder: number;
  isReady: boolean;
};

export type CaseStep = {
  id: string;
  title: string;
  guidance: string;
  stepKind: "PREPARE" | "VISIT" | "HANDOFF" | "FOLLOWUP";
  sortOrder: number;
  status: StepStatus;
};

export type CaseHandoff = {
  id: string;
  label: string;
  officialUrl: string;
  channelType: "WEB" | "PHYSICAL" | "OTHER";
  caveat: string | null;
};

export type StaleVersion = {
  versionNumber: number;
  slug: string;
};

export type CaseSummary = {
  id: string;
  status: CaseStatus;
  startedAt: Date;
  service: {
    slug: string;
    title: string;
    categoryName: string;
  };
  versionNumber: number;
  verifiedAt: Date;
  requirementTotal: number;
  requirementReady: number;
  stepTotal: number;
  stepDone: number;
  nextAction: string;
  staleVersion: StaleVersion | null;
};

export type CaseDetail = CaseSummary & {
  serviceVersionId: string;
  summary: string;
  eligibilityNote: string | null;
  requirements: CaseRequirement[];
  steps: CaseStep[];
  handoffs: CaseHandoff[];
};

export type CaseActionResult = { ok: true } | { ok: false; message: string };

export type CreateCaseResult = { ok: true; caseId: string } | { ok: false; message: string };

export type CaseActionState = {
  status: "idle" | "error";
  message?: string;
};
