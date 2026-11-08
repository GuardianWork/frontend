import type { ReactNode } from "react";
import { CircleAlert, Info } from "lucide-react";

/** One decision-relevant fact, with its evidence and any related actions. */
export function StaffDetailNotice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "warning" | "danger";
}) {
  const Icon = tone === "neutral" ? Info : CircleAlert;
  return (
    <section className="staff-detail-notice" data-tone={tone} aria-label={title}>
      <div className="staff-detail-notice-heading">
        <Icon size={18} aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <div className="staff-detail-notice-content">{children}</div>
    </section>
  );
}
