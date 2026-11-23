import type { AdminMessageCode } from "./messages";

export type AdminResult = { ok: true } | { ok: false; error: AdminMessageCode };

export type AdminCreateResult =
  { ok: true; serviceId: string; versionId: string } | { ok: false; error: AdminMessageCode };

export type AdminVersionCreateResult =
  { ok: true; versionId: string } | { ok: false; error: AdminMessageCode };
