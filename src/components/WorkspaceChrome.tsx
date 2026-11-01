import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { MenuIcon } from "./icons";
import { Button } from "./ui/button";

/** The same brand and navigation controls across GuardianWork's three workspaces. */
export function WorkspaceBrand({ to }: { to: "/can" | "/staff" | "/rec" }) {
  return (
    <Link to={to} className="workspace-header-brand" aria-label="GuardianWork — Tổng quan">
      <ShieldCheck size={27} aria-hidden="true" />
      <span>GuardianWork</span>
    </Link>
  );
}

export function WorkspaceNavigationToggle({
  expanded,
  onToggle,
  controls,
}: {
  expanded: boolean;
  onToggle: () => void;
  controls: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="workspace-rail-toggle"
      aria-label={expanded ? "Thu gọn điều hướng" : "Mở rộng điều hướng"}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
    >
      <MenuIcon size={22} aria-hidden="true" />
    </Button>
  );
}
