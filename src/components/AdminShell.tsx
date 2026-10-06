import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type ShellRole = "admin" | "candidate" | "recruiter";

type NavItem = { to: string; label: string; icon: string };

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/compliance", label: "Compliance Queue", icon: "verified_user" },
  { to: "/admin/candidates", label: "Network Directory", icon: "group" },
  { to: "/admin/analytics", label: "Analytics", icon: "analytics" },
];

const CANDIDATE_NAV: NavItem[] = [
  { to: "/candidate/jobs", label: "Verified Jobs", icon: "work" },
  { to: "/candidate/copilot", label: "AI Legal Copilot", icon: "gavel" },
  { to: "/candidate/profile", label: "My Profile", icon: "badge" },
];

const RECRUITER_NAV: NavItem[] = [
  { to: "/recruiter", label: "Recruiter Hub", icon: "hub" },
  { to: "/recruiter/talent", label: "Talent Profiles", icon: "person_search" },
  { to: "/recruiter/jobs", label: "Manage Jobs", icon: "work" },
];

const ROLES: { id: ShellRole; label: string; to: string; icon: string }[] = [
  { id: "admin", label: "Admin Console", to: "/admin", icon: "admin_panel_settings" },
  { id: "candidate", label: "Candidate Portal", to: "/candidate/jobs", icon: "person" },
  { id: "recruiter", label: "Recruiter Side", to: "/recruiter", icon: "hub" },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  const navItems =
    currentRole === "candidate"
      ? CANDIDATE_NAV
      : currentRole === "recruiter"
        ? RECRUITER_NAV
        : ADMIN_NAV;

  const roleMeta =
    currentRole === "candidate"
      ? {
          title: "Candidate Portal",
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
            title: "Admin Console",
            sub: "Platform & Compliance",
            icon: "admin_panel_settings",
            cta: "Kiểm toán JD mới",
            ctaTo: "/admin/compliance",
          };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-charcoal-text">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r border-warm-border bg-paper-white z-20 shrink-0">
        <div className="p-5 border-b border-warm-border">
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
        </div>

        {/* Role Switcher in Sidebar */}
        <div className="p-3 border-b border-warm-border bg-surface-container-low/40">
          <div className="text-[10px] font-bold text-charcoal-40 uppercase tracking-wider mb-2 px-1">
            Chuyển đổi phân hệ
          </div>
          <div className="flex flex-col gap-1">
            {ROLES.map((r) => {
              const active = currentRole === r.id;
              return (
                <Link
                  key={r.id}
                  to={r.to}
                  className={
                    active
                      ? "flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-on-primary shadow-xs"
                      : "flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-charcoal-83 hover:text-charcoal-text hover:bg-surface-container transition-colors"
                  }
                >
                  <span className="flex items-center gap-2">
                    <Icon name={r.icon} className="!text-[16px]" />
                    {r.label}
                  </span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          <div className="text-[10px] font-bold text-charcoal-40 uppercase tracking-wider mb-1 px-2 pt-2">
            Điều hướng {roleMeta.title}
          </div>
          {navItems.map((item) => {
            const active =
              item.to === "/admin" || item.to === "/recruiter" || item.to === "/candidate"
                ? pathname === item.to
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
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
          })}
        </nav>

        {/* Bottom CTA & Links */}
        <div className="p-4 border-t border-warm-border flex flex-col gap-3">
          <Link
            to={roleMeta.ctaTo}
            className="w-full py-2.5 px-4 bg-primary text-on-primary font-medium rounded-md hover:bg-charcoal-83 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            <Icon name="add" className="!text-base" />
            {roleMeta.cta}
          </Link>
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
              Public Landing (/vn)
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-parchment-bg">
        <header className="w-full bg-paper-white border-b border-warm-border h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-md border border-warm-border text-charcoal-83">
              <Icon name="menu" />
            </button>
            <div>
              <h1 className="hidden md:block font-bold text-xl text-charcoal-text tracking-tight">
                {title}
              </h1>
              <p className="hidden md:block text-[11px] font-mono text-charcoal-40">
                Phân hệ: <strong className="text-primary">{roleMeta.title}</strong>
              </p>
            </div>
          </div>

          {/* Top Center Role Bar */}
          <div className="hidden lg:flex items-center bg-surface-container-low p-1 rounded-xl border border-warm-border shadow-2xs">
            {ROLES.map((r) => {
              const active = currentRole === r.id;
              return (
                <Link
                  key={r.id}
                  to={r.to}
                  className={
                    active
                      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-paper-white text-primary text-xs font-bold shadow-xs border border-warm-border"
                      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-charcoal-40 hover:text-charcoal-text text-xs font-medium transition-colors"
                  }
                >
                  <Icon name={r.icon} className="!text-[16px]" />
                  <span>{r.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Top Right Extras & Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/vn"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-container border border-warm-border text-charcoal-text hover:bg-surface-container-high transition-colors"
            >
              <Icon name="public" className="!text-sm text-primary" />
              <span>Cổng ngoài (/vn)</span>
            </Link>

            {topNavExtras}

            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-md border border-warm-border bg-surface flex items-center justify-center text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors relative">
                <Icon name="notifications" className="!text-xl" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border border-paper-white" />
              </button>
              <Link
                to="/login"
                className="w-9 h-9 rounded-md border border-warm-border bg-surface flex items-center justify-center text-charcoal-40 hover:text-charcoal-text hover:bg-charcoal-04 transition-colors"
                title="Đăng nhập"
              >
                <Icon name="account_circle" className="!text-xl" />
              </Link>
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
