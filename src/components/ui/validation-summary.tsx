import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import "./validation-summary.css";

export function ValidationSummary({
  heading,
  children,
  hidden = false,
  role,
  className = "",
}: {
  heading: string;
  children: ReactNode;
  hidden?: boolean;
  role?: "alert";
  className?: string;
}) {
  return (
    <div
      className={`jp-validation-summary ${className}`}
      aria-live={role ? undefined : "polite"}
      role={role}
      hidden={hidden}
    >
      <CircleAlert size={30} className="jp-validation-icon" aria-hidden="true" />
      <div>
        <p className="jp-validation-heading">{heading}</p>
        <ul>{children}</ul>
      </div>
    </div>
  );
}
