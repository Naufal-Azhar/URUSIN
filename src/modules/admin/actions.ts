"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/modules/auth/guards";
import {
  addHandoffForAdmin,
  addRequirementForAdmin,
  addSourceForAdmin,
  addStepForAdmin,
  archiveVersionForAdmin,
  createServiceForAdmin,
  createVersionForAdmin,
  deleteHandoffForAdmin,
  deleteRequirementForAdmin,
  deleteStepForAdmin,
  markVersionVerifiedForAdmin,
  publishVersionForAdmin,
  rejectVersionForAdmin,
  removeSourceForAdmin,
  setReportStatusForAdmin,
  submitVersionForAdmin,
  updateVersionDraftForAdmin,
} from "./service";
import type { AdminMessageCode } from "./messages";

function editorPath(serviceId: string, versionId: string) {
  return `/admin/layanan/${serviceId}/versi/${versionId}`;
}

function errorRedirect(path: string, error: AdminMessageCode): never {
  redirect(`${path}?err=${error}`);
}

function successRedirect(path: string, message: AdminMessageCode): never {
  redirect(`${path}?msg=${message}`);
}

function refreshAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/layanan");
  revalidatePath("/admin/review");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin/audit");
  revalidatePath("/layanan");
}

export async function createServiceAction(formData: FormData) {
  const session = await requireAdmin();
  const result = await createServiceForAdmin({
    actorId: session.user.id,
    categoryId: String(formData.get("categoryId") ?? ""),
    code: String(formData.get("code") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
  });

  if (!result.ok) errorRedirect("/admin/layanan", result.error);

  refreshAdminPaths();
  redirect(`${editorPath(result.serviceId, result.versionId)}?msg=service_created`);
}

export async function createVersionAction(serviceId: string) {
  const session = await requireAdmin();
  const result = await createVersionForAdmin({
    actorId: session.user.id,
    serviceId,
  });

  if (!result.ok) errorRedirect(`/admin/layanan/${serviceId}`, result.error);

  refreshAdminPaths();
  successRedirect(editorPath(serviceId, result.versionId), "version_created");
}

export async function updateVersionAction(
  serviceId: string,
  versionId: string,
  formData: FormData,
) {
  const session = await requireAdmin();
  const result = await updateVersionDraftForAdmin({
    actorId: session.user.id,
    versionId,
    summary: String(formData.get("summary") ?? ""),
    eligibilityNote: String(formData.get("eligibilityNote") ?? ""),
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);

  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "saved");
}

export async function addRequirementAction(
  serviceId: string,
  versionId: string,
  formData: FormData,
) {
  const session = await requireAdmin();
  const result = await addRequirementForAdmin({
    actorId: session.user.id,
    versionId,
    title: String(formData.get("title") ?? ""),
    guidance: String(formData.get("guidance") ?? ""),
    conditionNote: String(formData.get("conditionNote") ?? ""),
    isRequired: formData.get("isRequired") === "on",
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "item_added");
}

export async function deleteRequirementAction(
  serviceId: string,
  versionId: string,
  requirementId: string,
) {
  const session = await requireAdmin();
  const result = await deleteRequirementForAdmin({
    actorId: session.user.id,
    versionId,
    requirementId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "item_deleted");
}

export async function addStepAction(serviceId: string, versionId: string, formData: FormData) {
  const session = await requireAdmin();
  const result = await addStepForAdmin({
    actorId: session.user.id,
    versionId,
    title: String(formData.get("title") ?? ""),
    guidance: String(formData.get("guidance") ?? ""),
    stepKind: String(formData.get("stepKind") ?? "") as
      "PREPARE" | "VISIT" | "HANDOFF" | "FOLLOWUP",
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "item_added");
}

export async function deleteStepAction(
  serviceId: string,
  versionId: string,
  workflowStepId: string,
) {
  const session = await requireAdmin();
  const result = await deleteStepForAdmin({
    actorId: session.user.id,
    versionId,
    workflowStepId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "item_deleted");
}

export async function addSourceAction(serviceId: string, versionId: string, formData: FormData) {
  const session = await requireAdmin();
  const result = await addSourceForAdmin({
    actorId: session.user.id,
    versionId,
    agencyName: String(formData.get("agencyName") ?? ""),
    title: String(formData.get("title") ?? ""),
    url: String(formData.get("url") ?? ""),
    lastCheckedAt: String(formData.get("lastCheckedAt") ?? ""),
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "source_added");
}

export async function removeSourceAction(
  serviceId: string,
  versionId: string,
  officialSourceId: string,
) {
  const session = await requireAdmin();
  const result = await removeSourceForAdmin({
    actorId: session.user.id,
    versionId,
    officialSourceId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "source_removed");
}

export async function addHandoffAction(serviceId: string, versionId: string, formData: FormData) {
  const session = await requireAdmin();
  const result = await addHandoffForAdmin({
    actorId: session.user.id,
    versionId,
    label: String(formData.get("label") ?? ""),
    officialUrl: String(formData.get("officialUrl") ?? ""),
    channelType: String(formData.get("channelType") ?? "") as "WEB" | "PHYSICAL" | "OTHER",
    caveat: String(formData.get("caveat") ?? ""),
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "handoff_added");
}

export async function deleteHandoffAction(serviceId: string, versionId: string, handoffId: string) {
  const session = await requireAdmin();
  const result = await deleteHandoffForAdmin({
    actorId: session.user.id,
    versionId,
    handoffId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "handoff_deleted");
}

export async function markVerifiedAction(serviceId: string, versionId: string) {
  const session = await requireAdmin();
  const result = await markVersionVerifiedForAdmin({
    actorId: session.user.id,
    versionId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "verified");
}

export async function submitVersionAction(serviceId: string, versionId: string) {
  const session = await requireAdmin();
  const result = await submitVersionForAdmin({
    actorId: session.user.id,
    versionId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "submitted");
}

export async function rejectVersionAction(serviceId: string, versionId: string) {
  const session = await requireAdmin();
  const result = await rejectVersionForAdmin({
    actorId: session.user.id,
    versionId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  successRedirect(editorPath(serviceId, versionId), "rejected");
}

export async function publishVersionAction(serviceId: string, versionId: string) {
  const session = await requireAdmin();
  const result = await publishVersionForAdmin({
    actorId: session.user.id,
    versionId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  revalidatePath(`/admin/layanan/${serviceId}`);
  successRedirect(`/admin/layanan/${serviceId}`, "published");
}

export async function archiveVersionAction(serviceId: string, versionId: string) {
  const session = await requireAdmin();
  const result = await archiveVersionForAdmin({
    actorId: session.user.id,
    versionId,
  });

  if (!result.ok) errorRedirect(editorPath(serviceId, versionId), result.error);
  refreshAdminPaths();
  revalidatePath(`/admin/layanan/${serviceId}`);
  successRedirect(`/admin/layanan/${serviceId}`, "archived");
}

export async function setReportStatusAction(reportId: string, formData: FormData) {
  const session = await requireAdmin();
  const result = await setReportStatusForAdmin({
    actorId: session.user.id,
    reportId,
    status: String(formData.get("status") ?? ""),
  });

  if (!result.ok) errorRedirect("/admin/laporan", result.error);
  refreshAdminPaths();
  successRedirect("/admin/laporan", "report_updated");
}
