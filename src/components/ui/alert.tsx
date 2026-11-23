import * as React from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "danger";

const variants: Record<AlertVariant, string> = {
  info: "border-teal-200 bg-teal-50 text-teal-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-red-200 bg-red-50 text-red-950",
};

export function Alert({
  variant = "info",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: AlertVariant }) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("rounded-lg border p-4 text-sm leading-6", variants[variant], className)}
      {...props}
    />
  );
}
