"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRequirementReadyAction } from "@/modules/cases/actions";

export function RequirementCheckbox({
  caseId,
  requirementId,
  initialReady,
  label,
  disabled = false,
}: {
  caseId: string;
  requirementId: string;
  initialReady: boolean;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialReady);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || isPending}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);
          setError(null);
          startTransition(async () => {
            const result = await setRequirementReadyAction(caseId, requirementId, next);
            if (!result.ok) {
              setChecked(!next);
              setError(result.message);
              return;
            }
            router.refresh();
          });
        }}
        className="text-primary focus-visible:ring-ring h-5 w-5 rounded border-gray-300 focus-visible:ring-2 focus-visible:ring-offset-2"
      />
      {error ? (
        <p role="alert" className="text-danger mt-1 text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
