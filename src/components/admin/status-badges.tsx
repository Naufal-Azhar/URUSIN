import {
  reportStatusLabels,
  reportStatusStyles,
  versionStatusLabels,
  versionStatusStyles,
} from "@/modules/admin/labels";

type VersionStatus = keyof typeof versionStatusLabels;
type ReportStatus = keyof typeof reportStatusLabels;

export function VersionStatusBadge({ status }: { status: VersionStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${versionStatusStyles[status]}`}
    >
      {versionStatusLabels[status]}
    </span>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${reportStatusStyles[status]}`}
    >
      {reportStatusLabels[status]}
    </span>
  );
}
