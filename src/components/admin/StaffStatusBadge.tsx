import type { ReactNode } from "react";

export type StaffStatusTone =
  "info" | "neutral" | "pending" | "verified" | "rejected" | "purple" | "orange" | "teal";

export function StaffStatusBadge({
  tone,
  children,
  className = "",
}: {
  tone: StaffStatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`admin-record-status admin-record-status--${tone}${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}
