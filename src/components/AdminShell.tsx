import { Link, useRouterState } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronDown, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
  { to: "/candidate/jobs", label: "Tìm việc làm", icon: "work" },
  { to: "/candidate/copilot", label: "Trợ lý pháp lý", icon: "gavel" },
  { to: "/candidate/profile", label: "Hồ sơ của tôi", icon: "badge" },
];

const RECRUITER_NAV: NavItem[] = [
  { to: "/recruiter", label: "Recruiter Hub", icon: "hub" },
  { to: "/recruiter/verification", label: "Xác thực Pháp nhân", icon: "verified" },
  { to: "/recruiter/talent", label: "Talent Profiles", icon: "person_search" },
  { to: "/recruiter/jobs", label: "Manage Jobs", icon: "work" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

export function AdminShell({
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    if (pathname.startsWith("/candidate")) {
      currentRole = "candidate";
    } else if (pathname.startsWith("/recruiter")) {
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
          ctaTo: "/candidate/jobs",
        }
      : currentRole === "recruiter"
        ? {
            title: "Recruiter Side",
            sub: "Talent Sourcing & Pipeline",
            icon: "hub",
            cta: "Đăng tin tuyển dụng",
            ctaTo: "/recruiter",
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
      item.to === "/admin" || item.to === "/recruiter" || item.to === "/candidate"
        ? pathname === item.to
        : pathname.startsWith(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        activeOptions={{
          exact: item.to === "/admin" || item.to === "/recruiter" || item.to === "/candidate",
        }}
        aria-current={active ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
        className={
          active
            ? "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold bg-surface-container text-charcoal-text"
            : "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors"
        }
      >
        <Icon name={item.icon} className="!text-xl" />
        {item.label}
      </Link>
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
      className={`${currentRole === "admin" ? "admin-workspace " : ""}workspace-shell flex h-screen w-full overflow-hidden bg-background text-charcoal-text`}
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center">
              <Icon name={roleMeta.icon} className="!text-2xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg tracking-tight leading-tight text-primary">
                GuardianWork
              </h2>
              <p className="text-charcoal-40 text-xs font-semibold uppercase tracking-wider">
                {roleMeta.title}
              </p>
            </div>
          </div>
          {currentRole === "admin" && (
            <button
              type="button"
              className="admin-navigation-close md:hidden"
              aria-label="Đóng điều hướng"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto"
        >
          {currentRole !== "admin" && (
            <div className="text-[10px] font-bold text-charcoal-40 uppercase tracking-wider mb-1 px-2 pt-2">
              Điều hướng {roleMeta.title}
            </div>
          )}
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

        {/* Bottom CTA & Links */}
        <div className="p-4 border-t border-warm-border flex flex-col gap-3">
          {currentRole !== "admin" && (
            <Link
              to={roleMeta.ctaTo}
              className="w-full py-2.5 px-4 bg-primary text-on-primary font-medium rounded-md hover:bg-charcoal-83 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              <Icon name="add" className="!text-base" />
              {roleMeta.cta}
            </Link>
          )}
          <div className="flex flex-col gap-1">
            <Link
              to="/login"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors"
            >
              <Icon name="lock" className="!text-base" />
              Xác thực định danh
            </Link>
            <Link
              to="/vn"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors"
            >
              <Icon name="public" className="!text-base" />
              Trang chủ GuardianWork
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="workspace-content min-w-0 flex-1 flex flex-col h-screen overflow-hidden bg-parchment-bg">
        <header className="w-full bg-paper-white border-b border-warm-border h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="min-w-0 flex items-center gap-4">
            <button
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md border border-warm-border text-charcoal-83"
            >
              <Icon name="menu" />
            </button>
            <div className="min-w-0">
              <p className="workspace-page-title font-bold text-sm md:text-xl text-charcoal-text tracking-tight">
                {title}
              </p>
              {currentRole !== "admin" && (
                <p className="hidden md:block text-[11px] font-mono text-charcoal-40">
                  Phân hệ: <strong className="text-primary">{roleMeta.title}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Top Right Extras & Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/vn"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container border border-warm-border text-charcoal-text hover:bg-surface-container-high transition-colors"
            >
              <Icon name="public" className="!text-sm text-primary" />
              <span>Trang chủ</span>
            </Link>

            {currentRole === "recruiter" && (
              <Link
                to="/recruiter/verification"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                <Icon name="verified" className="!text-sm text-primary" />
                <span>Xác thực KYB</span>
              </Link>
            )}

            {topNavExtras}

            <div className="flex items-center gap-2">
              {currentRole !== "admin" && (
                <span
                  role="img"
                  aria-label="Thông báo"
                  className="hidden sm:flex w-9 h-9 rounded-md border border-warm-border bg-surface items-center justify-center text-charcoal-40 relative"
                >
                  <Icon name="notifications" className="!text-xl" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border border-paper-white" />
                </span>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { Icon };
