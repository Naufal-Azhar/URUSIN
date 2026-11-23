"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createCaseAction } from "@/modules/cases/actions";
import type { CaseActionState } from "@/modules/cases/types";

const initialState: CaseActionState = { status: "idle" };

export function StartCaseForm({ slug }: { slug: string }) {
  const [state, formAction, isPending] = useActionState(createCaseAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      {state.status === "error" ? (
        <Alert variant="danger" aria-live="polite">
          {state.message}
        </Alert>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Menyiapkan…" : "Mulai pengurusan"}
      </Button>
      <p className="text-muted text-sm leading-6">
        Progres yang Anda tandai adalah catatan pribadi, bukan status instansi.
      </p>
    </form>
  );
}
