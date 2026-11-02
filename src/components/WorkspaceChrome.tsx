import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";
import { ShieldCheck } from "lucide-react";
import { MenuIcon } from "./icons";
import { Button } from "./ui/button";

/** The same brand and navigation controls across GuardianWork's three workspaces. */
export function WorkspaceBrand({ to }: { to: "/can/jobs" | "/staff" | "/rec" }) {
  const { locale } = useLanguage();
  return (
    <Link
      to={to}
      className="workspace-header-brand"
      aria-label={candidateWorkspaceCopy[locale].chrome.brandAria}
    >
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
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].chrome;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="workspace-rail-toggle"
      aria-label={expanded ? copy.collapseNav : copy.expandNav}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
    >
      <MenuIcon size={22} aria-hidden="true" />
    </Button>
  );
}
