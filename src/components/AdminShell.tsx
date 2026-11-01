import { SidebarState } from "@/context/sidebar-state";
import { SidebarCollapseButton, SidebarLabel } from "./SidebarControls";
import { useWorkspaceLayout } from "@/context/WorkspaceLayoutContext";
import { WorkspaceFooter } from "./WorkspaceFooter";
import { useNavigationFocus } from "@/hooks/useNavigationFocus";
import * as SemanticIcons from "@/components/icons";
import "./workspace.css";
import {
  JobIcon,
  LegalReferenceIcon,
  CandidateProfileIcon,
  MenuIcon,
  CloseIcon,
  GlobeIcon,
} from "@/components/icons";
import { Link, useRouterState } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronDown, X, ShieldCheck } from "lucide-react";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { StaffShell } from "./StaffShell";
import { LogoutButton } from "./LogoutButton";
import { RecruiterShell } from "./RecruiterShell";

export type ShellRole = "admin" | "candidate" | "recruiter";

type NavItem = { to: string; label: string; icon: string };

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Tổng quan", icon: "dashboard" },
  { to: "/admin/verifications", label: "Xác minh công ty", icon: "domain_verification" },
  { to: "/admin/reports", label: "Báo cáo vi phạm", icon: "flag" },
  { to: "/admin/accounts", label: "Quản lý tài khoản", icon: "group" },
  { to: "/admin/monitoring", label: "Giám sát hệ thống", icon: "monitoring" },
  { to: "/admin/tasks", label: "Tác vụ nền", icon: "schedule" },
];
const ADMIN_JOB_NAV: NavItem[] = [
  { to: "/admin/jobs", label: "Tất cả tin tuyển dụng", icon: "work" },
  { to: "/admin/compliance", label: "JD bị AI gắn cờ", icon: "gavel" },
];

const CANDIDATE_NAV: NavItem[] = [
  { to: "/can/jobs", label: "Tìm việc làm", icon: "work" },
  { to: "/can/cvs", label: "Hồ sơ xin việc", icon: "description" },
  { to: "/can/profile", label: "Hồ sơ của tôi", icon: "badge" },
  { to: "/can/copilot", label: "Trợ lý pháp lý", icon: "gavel" },
];

const RECRUITER_NAV: NavItem[] = [
  { to: "/rec", label: "Recruiter Hub", icon: "hub" },
  { to: "/rec/verification", label: "Xác thực Pháp nhân", icon: "verified" },
  { to: "/rec/talent", label: "Talent Profiles", icon: "person_search" },
  { to: "/rec/jobs", label: "Manage Jobs", icon: "work" },
];

// Transitional aliases for routed legacy JSX; unresolved consumers retain Material Symbols.
const semanticSymbols = {
  work: SemanticIcons.JobIcon,
  badge: SemanticIcons.CandidateProfileIcon,
  gavel: SemanticIcons.LegalReferenceIcon,
  policy: SemanticIcons.LegalReferenceIcon,
  shield: SemanticIcons.LegalReferenceIcon,
  verified_user: SemanticIcons.LegalReferenceIcon,
  smart_toy: SemanticIcons.LegalReferenceIcon,
  description: SemanticIcons.CvIcon,
  download: SemanticIcons.DownloadIcon,
  upload: SemanticIcons.UploadIcon,
  person_search: SemanticIcons.TalentSearchIcon,
  group: SemanticIcons.CompanyMembersIcon,
  history_edu: SemanticIcons.SubmissionHistoryIcon,
  content_copy: SemanticIcons.CopyIcon,
  open_in_new: SemanticIcons.ExternalLinkIcon,
  arrow_forward: SemanticIcons.ArrowRightIcon,
  info: SemanticIcons.InformationIcon,
  help: SemanticIcons.InformationIcon,
  contact_support: SemanticIcons.InformationIcon,
  check: SemanticIcons.CheckIcon,
  check_circle: SemanticIcons.CheckIcon,
  verified: SemanticIcons.VerifiedIcon,
  add: SemanticIcons.AddIcon,
  close: SemanticIcons.CloseIcon,
  edit: SemanticIcons.EditIcon,
  mail: SemanticIcons.EmailIcon,
  mark_email_read: SemanticIcons.InvitationIcon,
  account_box: SemanticIcons.CandidateProfileIcon,
  search: SemanticIcons.SearchIcon,
  location_on: SemanticIcons.LocationIcon,
  filter_list: SemanticIcons.FilterIcon,
  translate: SemanticIcons.GlobeIcon,
  link: SemanticIcons.LinkIcon,
  hub: SemanticIcons.RecruitmentOverviewIcon,
  send: SemanticIcons.ArrowRightIcon,
  auto_awesome: SemanticIcons.InformationIcon,
  lock: SemanticIcons.LockIcon,
  public: SemanticIcons.GlobeIcon,
  menu: SemanticIcons.MenuIcon,
};
function Icon({ name, className = "" }: { name: string; className?: string }) {
  const Symbol = semanticSymbols[name as keyof typeof semanticSymbols];
  return Symbol ? (
    <Symbol size="1em" className={className} />
  ) : (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

export function AdminShell(props: {
  title: string;
  role?: ShellRole;
  topNavExtras?: ReactNode;
  children: ReactNode;
}) {
  const layout = useWorkspaceLayout();
  return layout ? <>{props.children}</> : <AdminShellFrame {...props} />;
}
function AdminShellFrame({
  title,
  role: forcedRole,
  topNavExtras,
  children,
}: {
  title: string;
  role?: ShellRole;
  topNavExtras?: ReactNode;
  children: ReactNode;
}) {
  const { collapsed, animate } = useContext(SidebarState);
  const [menuOpen, setMenuOpen] = useState(false);
  useNavigationFocus(menuOpen, "workspace-navigation");
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [jobGroupOpen, setJobGroupOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (
      pathname.startsWith("/admin/jobs") ||
      pathname.startsWith("/admin/job-approvals") ||
      pathname.startsWith("/admin/compliance")
    ) {
      setJobGroupOpen(true);
    }
  }, [pathname]);
  const jobGroupExpanded =
    jobGroupOpen ??
    (pathname.startsWith("/admin/jobs") ||
      pathname.startsWith("/admin/job-approvals") ||
      pathname.startsWith("/admin/compliance"));

  // Infer role from pathname or use forcedRole
  let currentRole: ShellRole = forcedRole || "admin";
  if (!forcedRole) {
    if (pathname.startsWith("/can")) {
      currentRole = "candidate";
    } else if (pathname.startsWith("/rec")) {
      currentRole = "recruiter";
    } else {
      currentRole = "admin";
    }
  }

  if (currentRole === "admin" && pathname.startsWith("/staff")) {
    return (
      <StaffShell title={title} topNavExtras={topNavExtras}>
        {children}
      </StaffShell>
    );
  }

  const navItems =
    currentRole === "candidate"
      ? CANDIDATE_NAV
      : currentRole === "recruiter"
        ? RECRUITER_NAV
        : ADMIN_NAV;

  const roleMeta =
    currentRole === "candidate"
      ? {
          title: "Ứng viên",
          sub: "Talent Safeguard & Jobs",
          icon: "person",
          cta: "Tìm việc chuẩn Luật",
          ctaTo: "/can/jobs",
        }
      : currentRole === "recruiter"
        ? {
            title: "Recruiter Side",
            sub: "Talent Sourcing & Pipeline",
            icon: "hub",
            cta: "Đăng tin tuyển dụng",
            ctaTo: "/rec",
          }
        : {
            title: "Quản trị",
            sub: "Nền tảng và tuân thủ",
            icon: "admin_panel_settings",
            cta: "Rà soát tin tuyển dụng",
            ctaTo: "/admin/compliance",
          };

  const renderNavItem = (item: NavItem) => {
    const active =
      item.to === "/admin" || item.to === "/rec" || item.to === "/can"
        ? pathname === item.to
        : pathname.startsWith(item.to);
    return (
      <SidebarLabel key={item.to} label={item.label}>
        <Link
          aria-label={item.label}
          to={item.to}
          activeOptions={{
            exact: item.to === "/admin" || item.to === "/rec" || item.to === "/can",
          }}
          aria-current={active ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
          className={
            currentRole === "candidate"
              ? "workspace-nav-link"
              : active
                ? "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold bg-surface-container text-charcoal-text"
                : "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors"
          }
        >
          {currentRole === "candidate" ? (
            <>
              <span className="workspace-nav-icon">
                {item.icon === "work" ? (
                  <JobIcon size={20} />
                ) : item.icon === "gavel" ? (
                  <LegalReferenceIcon size={20} />
                ) : (
                  <CandidateProfileIcon size={20} />
                )}
              </span>
              <span className="workspace-nav-label">{item.label}</span>
            </>
          ) : (
            <>
              <Icon name={item.icon} className="!text-xl" />
              {item.label}
            </>
          )}
        </Link>
      </SidebarLabel>
    );
  };

  const isRecruiter = currentRole === "recruiter";
  if (isRecruiter) {
    return (
      <RecruiterShell title={title} topNavExtras={topNavExtras}>
        {children}
      </RecruiterShell>
    );
  }

  return (
    <div
      data-sidebar-collapsed={collapsed}
      data-sidebar-animate={animate}
      className={`${currentRole === "admin" ? "admin-workspace " : "candidate-workspace "}workspace-shell flex h-screen w-full overflow-hidden bg-background text-charcoal-text`}
    >
      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Đóng điều hướng"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        id="workspace-navigation"
        className={`${menuOpen ? "flex" : "hidden"} workspace-sidebar fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-warm-border bg-paper-white md:static md:z-20 md:flex md:h-screen md:shrink-0`}
      >
        <div className="workspace-brand p-5 border-b border-warm-border">
          <div className="workspace-brand__identity flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center">
              {currentRole === "candidate" ? (
                <ShieldCheck size={24} aria-hidden="true" />
              ) : (
                <Icon name={roleMeta.icon} className="!text-2xl" />
              )}
            </div>
            <div className="workspace-brand__copy">
              <h2 className="font-semibold text-lg tracking-tight leading-tight text-primary">
                GuardianWork
              </h2>
              <p className="text-charcoal-40 text-xs font-semibold  ">{roleMeta.title}</p>
            </div>
          </div>
          {(currentRole === "admin" || currentRole === "candidate") && (
            <button
              type="button"
              className="admin-navigation-close md:hidden"
              aria-label="Đóng điều hướng"
              onClick={() => setMenuOpen(false)}
            >
              <CloseIcon size={20} />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav
          aria-label="Điều hướng chính"
          className={`${currentRole === "candidate" ? "workspace-navigation " : ""}flex-1 flex flex-col gap-1 p-3 overflow-y-auto`}
        >
          {currentRole === "admin" ? (
            <>
              {ADMIN_NAV.slice(0, 2).map(renderNavItem)}
              <section className="workspace-nav-group">
                <button
                  type="button"
                  className="workspace-nav-group-toggle"
                  aria-expanded={jobGroupExpanded}
                  aria-controls="admin-job-nav-items"
                  onClick={() => setJobGroupOpen((open) => !(open ?? jobGroupExpanded))}
                >
                  <span>
                    <BriefcaseBusiness size={20} aria-hidden="true" />
                    Quản lý tin tuyển dụng
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`workspace-nav-chevron ${jobGroupExpanded ? "is-open" : ""}`}
                  />
                </button>
                <div
                  id="admin-job-nav-items"
                  className="workspace-nav-group-items"
                  hidden={!jobGroupExpanded}
                >
                  {ADMIN_JOB_NAV.map(renderNavItem)}
                </div>
              </section>
              <div className="admin-navigation-section">
                {ADMIN_NAV.slice(2, 4).map(renderNavItem)}
              </div>
              <div className="admin-navigation-section">
                {ADMIN_NAV.slice(4).map(renderNavItem)}
              </div>
            </>
          ) : (
            navItems.map(renderNavItem)
          )}
        </nav>

        {currentRole === "candidate" ? (
          <WorkspaceFooter role="candidate" onNavigate={() => setMenuOpen(false)} />
        ) : (
          <div className="workspace-sidebar-footer">
            <Link to="/vn" className="workspace-footer-link">
              <GlobeIcon size={18} /> Trang chủ GuardianWork
            </Link>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <div className="workspace-content min-w-0 flex-1 flex flex-col h-screen overflow-hidden bg-parchment-bg">
        <header className="w-full bg-paper-white border-b border-warm-border h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="min-w-0 flex items-center gap-4">
            {currentRole === "candidate" && (
              <SidebarCollapseButton controls="workspace-navigation" />
            )}
            <button
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md border border-warm-border text-charcoal-83"
            >
              <MenuIcon size={22} />
            </button>
            <div className="min-w-0">
              <p className="workspace-page-title font-bold text-sm md:text-xl text-charcoal-text tracking-tight">
                {title}
              </p>
            </div>
          </div>

          {/* Top Right Extras & Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            {currentRole === "recruiter" && (
              <Link
                to="/rec/verification"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                <Icon name="verified" className="!text-sm text-primary" />
                <span>Xác thực KYB</span>
              </Link>
            )}

            {topNavExtras}

            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="workspace-page max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { Icon };
