"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { setStepStatusAction } from "@/modules/cases/actions";
import { stepStatusLabels } from "@/modules/cases/labels";
import type { StepStatus } from "@/modules/cases/types";

export function StepStatusSelect({
  caseId,
  workflowStepId,
  initialStatus,
  label,
  disabled = false,
}: {
  caseId: string;
  workflowStepId: string;
  initialStatus: StepStatus;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<StepStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Select
        value={status}
        disabled={disabled || isPending}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.value as StepStatus;
          const previous = status;
          setStatus(next);
          setError(null);
          startTransition(async () => {
            const result = await setStepStatusAction(caseId, workflowStepId, next);
            if (!result.ok) {
              setStatus(previous);
              setError(result.message);
              return;
            }
            router.refresh();
          });
        }}
        className="h-9 w-full max-w-64 text-sm"
      >
        {Object.entries(stepStatusLabels).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </Select>
      {error ? (
        <p role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
