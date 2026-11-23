export type ReportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
