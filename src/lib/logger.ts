import "server-only";
import { randomUUID } from "node:crypto";

type LogValue = string | number | boolean | null | undefined;

type AllowedFields = {
  requestId?: string;
  userId?: string;
  route?: string;
  outcome?: "ok" | "denied" | "invalid" | "error";
  errorCode?: string;
  durationMs?: number;
  count?: number;
};

function emit(level: "info" | "warn" | "error", event: string, fields: AllowedFields = {}) {
  const entry: Record<string, LogValue> = {
    ts: new Date().toISOString(),
    level,
    event,
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) entry[key] = value;
  }

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function logInfo(event: string, fields?: AllowedFields) {
  emit("info", event, fields);
}

export function logWarn(event: string, fields?: AllowedFields) {
  emit("warn", event, fields);
}

export function logError(event: string, error: unknown, fields?: AllowedFields) {
  const errorCode = error instanceof Error && error.name.length > 0 ? error.name : "UnknownError";
  emit("error", event, { ...fields, errorCode });
}

export function newRequestId() {
  return randomUUID();
}
