import type { ReactNode } from "react";
import { ArrowUpLeft, Check, Clock3, EyeOff, Info, Minus, X, type LucideIcon } from "lucide-react";

export type StaffStatusTone =
  "info" | "neutral" | "pending" | "verified" | "rejected" | "purple" | "orange" | "teal";

const statusIcons: Record<StaffStatusTone, LucideIcon> = {
  info: Info,
  neutral: Minus,
  pending: Clock3,
  verified: Check,
  rejected: X,
  purple: ArrowUpLeft,
  orange: EyeOff,
  teal: Check,
};

export function StaffStatusBadge({
  tone,
  children,
  className = "",
  icon,
}: {
  tone: StaffStatusTone;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon | true;
}) {
  const Icon = icon === true ? statusIcons[tone] : icon;
  return (
    <span
      className={`admin-record-status admin-record-status--${tone}${className ? ` ${className}` : ""}`}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}
