import { SidebarLabel } from "./SidebarControls";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";
import { GlobeIcon, LockIcon } from "@/components/icons";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

/** The same three destinations, in the same order, in both USER workspaces. */
export function WorkspaceFooter({
  role,
  onNavigate,
}: {
  role: "candidate" | "recruiter";
  onNavigate?: () => void;
}) {
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].chrome.footer;
  const user = useAuthUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (user?.role !== "USER") return null;
  const accountPath = role === "recruiter" ? "/rec/account" : "/can/account";
  return (
    <nav className="workspace-sidebar-footer workspace-quick-navigation" aria-label={copy.quickNav}>
      <SidebarLabel label={copy.accountSettings}>
        <Link
          aria-label={copy.accountSettings}
          to={accountPath}
          onClick={onNavigate}
          className="workspace-footer-link"
          aria-current={pathname === accountPath ? "page" : undefined}
        >
          <LockIcon size={18} />
          <span>{copy.accountSettings}</span>
        </Link>
      </SidebarLabel>
      <SidebarLabel
        label={`${copy.switchWorkspace} · ${role === "recruiter" ? copy.switchToJobs : copy.switchToRecruiting}`}
      >
        <Link
          aria-label={copy.switchWorkspace}
          to={role === "recruiter" ? "/can/jobs" : "/rec"}
          onClick={onNavigate}
          className="workspace-footer-link"
        >
          <ArrowLeftRight size={18} aria-hidden="true" />
          <span>
            {copy.switchWorkspace}
            <span className="workspace-quick-navigation__hint">
              {role === "recruiter" ? copy.switchToJobs : copy.switchToRecruiting}
            </span>
          </span>
        </Link>
      </SidebarLabel>
      <SidebarLabel label={copy.home}>
        <Link
          aria-label={copy.home}
          to="/vn"
          onClick={onNavigate}
          className="workspace-footer-link"
        >
          <GlobeIcon size={18} />
          <span>{copy.home}</span>
        </Link>
      </SidebarLabel>
    </nav>
  );
}
