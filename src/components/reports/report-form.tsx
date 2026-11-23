"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitReportAction } from "@/modules/reports/actions";
import { reportIssueTypeLabels } from "@/modules/reports/schemas";
import type { ReportActionState } from "@/modules/reports/types";

const initialState: ReportActionState = { status: "idle" };

export function ReportForm({ services }: { services: Array<{ id: string; title: string }> }) {
  const [state, formAction, isPending] = useActionState(submitReportAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="serviceId">Layanan</Label>
        <Select id="serviceId" name="serviceId" required defaultValue="">
          <option value="" disabled>
            Pilih layanan
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="issueType">Jenis masalah</Label>
        <Select id="issueType" name="issueType" required defaultValue="OUTDATED_INFO">
          {Object.entries(reportIssueTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Keterangan</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={1000}
          aria-describedby="message-help"
          placeholder="Jelaskan bagian yang perlu diperbaiki. Jangan sertakan data pribadi."
        />
        <p id="message-help" className="text-muted text-sm">
          Minimal 20 karakter, maksimal 1000 karakter. Jangan mengirim NIK, nomor KK/SIM, atau data
          pribadi lain.
        </p>
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "success" ? (
        <Alert variant="info" aria-live="polite">
          {state.message}
        </Alert>
      ) : null}

      {state.status === "error" ? (
        <Alert variant="danger" aria-live="polite">
          {state.message}
        </Alert>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Mengirim…" : "Kirim laporan"}
      </Button>
    </form>
  );
}
