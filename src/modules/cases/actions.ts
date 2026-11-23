"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/guards";
import {
  archiveCaseForUser,
  createCaseForUser,
  deleteCaseForUser,
  markCaseDoneForUser,
  setRequirementReadyForUser,
  setStepStatusForUser,
} from "./service";
import type { CaseActionState, CaseActionResult, StepStatus } from "./types";

export async function createCaseAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const slug = String(formData.get("slug") ?? "");
  const session = await requireUser(`/layanan/${slug}`);
  const result = await createCaseForUser({
    userId: session.user.id,
    slug,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/dashboard");
  redirect(`/pengurusan/${result.caseId}`);
}

export async function setRequirementReadyAction(
  caseId: string,
  requirementId: string,
  isReady: boolean,
): Promise<CaseActionResult> {
  const session = await requireUser(`/pengurusan/${caseId}`);
  const result = await setRequirementReadyForUser({
    userId: session.user.id,
    caseId,
    requirementId,
    isReady,
  });

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/pengurusan/${caseId}`);
  }

  return result;
}

export async function setStepStatusAction(
  caseId: string,
  workflowStepId: string,
  status: StepStatus,
): Promise<CaseActionResult> {
  const session = await requireUser(`/pengurusan/${caseId}`);
  const result = await setStepStatusForUser({
    userId: session.user.id,
    caseId,
    workflowStepId,
    status,
  });

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath(`/pengurusan/${caseId}`);
  }

  return result;
}

export async function markCaseDoneAction(caseId: string) {
  const session = await requireUser(`/pengurusan/${caseId}`);
  const result = await markCaseDoneForUser({
    userId: session.user.id,
    caseId,
  });

  if (!result.ok) notFound();

  revalidatePath("/dashboard");
  revalidatePath(`/pengurusan/${caseId}`);
}

export async function archiveCaseAction(caseId: string) {
  const session = await requireUser(`/pengurusan/${caseId}`);
  const result = await archiveCaseForUser({
    userId: session.user.id,
    caseId,
  });

  if (!result.ok) notFound();

  revalidatePath("/dashboard");
  revalidatePath(`/pengurusan/${caseId}`);
  redirect("/dashboard");
}

export async function deleteCaseAction(caseId: string) {
  const session = await requireUser(`/dashboard`);
  const result = await deleteCaseForUser({
    userId: session.user.id,
    caseId,
  });

  if (!result.ok) notFound();

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
