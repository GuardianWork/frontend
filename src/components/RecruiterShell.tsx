import { useNavigationFocus } from "@/hooks/useNavigationFocus";
import { EmailVerificationPanel } from "@/components/auth/EmailVerification";
import "./workspace.css";
import "./admin/sidebar.css";
import {
  MenuIcon,
  CloseIcon,
  AddIcon,
  ArrowUpRightIcon,
  GlobeIcon,
  JobIcon,
  CandidateProfileIcon,
  ApplicationIcon,
  TalentSearchIcon,
  CompanyMembersIcon,
  VerificationDossierIcon,
  RecruitmentOverviewIcon,
} from "@/components/icons";
import { useEmployerOnboarding } from "@/context/EmployerOnboardingContext";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { LeaveCompanyButton } from "./LeaveCompanyButton";
import { LogoutButton } from "./LogoutButton";
import { isStaffUser } from "@/services/auth";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

const navigation = [
  { to: "/recruiter", label: "Tổng quan", icon: RecruitmentOverviewIcon },
  { to: "/recruiter/jobs", label: "Tin tuyển dụng", icon: JobIcon },
  { to: "/recruiter/talent", label: "Tìm kiếm ứng viên", icon: TalentSearchIcon },
  { to: "/recruiter/applications", label: "Đơn ứng tuyển", icon: ApplicationIcon },
  { to: "/recruiter/members", label: "Thành viên công ty", icon: CompanyMembersIcon },
  { to: "/recruiter/verification", label: "Hồ sơ công ty", icon: VerificationDossierIcon },
];

export function RecruiterShell({
  title,
  children,
  topNavExtras,
}: {
  title: string;
  children: ReactNode;
  topNavExtras?: ReactNode;
}) {
  const onboarding = useEmployerOnboarding();
  const stage = onboarding?.onboarding.stage;
  const recruitingEnabled = stage === "VERIFIED";
  const { member } = useCompanyWorkspace();
  const user = useAuthUser();
  const invitedRecruiter = user?.activeMembership?.companyRole === "RECRUITER";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  useNavigationFocus(menuOpen, "recruiter-navigation");
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <div className="recruiter-workspace workspace-shell flex h-dvh w-full overflow-hidden bg-background text-charcoal-text">
      {menuOpen && (
        <button
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        id="recruiter-navigation"
        className={`${menuOpen ? "flex" : "hidden"} workspace-sidebar fixed inset-y-0 left-0 z-50 h-dvh w-64 flex-col border-r border-warm-border bg-paper-white md:static md:z-20 md:flex md:shrink-0`}
      >
        <div className="workspace-brand flex min-h-[76px] items-center justify-between border-b border-warm-border px-5 py-4">
          <Link
            to="/recruiter"
            onClick={() => setMenuOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold leading-tight tracking-tight text-primary">
                GuardianWork
              </span>
              <span className="block text-xs font-medium text-charcoal-40">Nhà tuyển dụng</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
            className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-charcoal-04 md:hidden"
          >
            <CloseIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-5 border-b border-warm-border py-4">
            <p className="break-words text-sm font-semibold">
              {user?.activeMembership?.companyName || "Chưa đăng ký công ty"}
            </p>
            <p className="mt-1 text-xs text-charcoal-83">
              {user?.activeMembership?.companyRole || member?.role || "Tài khoản cá nhân"}
            </p>
          </div>
          <nav
            aria-label="Điều hướng nhà tuyển dụng"
            className="workspace-navigation flex flex-col"
          >
            {navigation
              .filter(
                (item) =>
                  !invitedRecruiter ||
                  !["/recruiter/members", "/recruiter/verification"].includes(item.to),
              )
              .map(({ to, label, icon: Icon }) => {
                const active =
                  to === "/recruiter"
                    ? pathname.replace(/\/$/, "") === to
                    : pathname.startsWith(to);
                const locked =
                  !recruitingEnabled &&
                  ![
                    "/recruiter",
                    "/recruiter/verification",
                    ...(stage === "COMPANY_ACTION_REQUIRED" ? ["/recruiter/members"] : []),
                  ].includes(to);
                if (locked)
                  return (
                    <span
                      key={to}
                      aria-disabled="true"
                      title="Hoàn tất thiết lập tuyển dụng để sử dụng"
                      className="workspace-nav-link workspace-nav-link--locked"
                    >
                      <span className="workspace-nav-icon">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="workspace-nav-label">{label}</span>
                      <span className="ml-auto text-xs">Khóa</span>
                    </span>
                  );
                return (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: to === "/recruiter" }}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="workspace-nav-link"
                  >
                    <span className="workspace-nav-icon">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="workspace-nav-label">{label}</span>
                  </Link>
                );
              })}
          </nav>
          {!invitedRecruiter && (
            <div className="mx-3 mb-4 mt-6 rounded-lg bg-surface-container-low p-4">
              <VerificationDossierIcon className="mb-3 text-primary" size={24} />
              <p className="text-sm font-semibold">Xây dựng uy tín doanh nghiệp</p>
              <p className="mt-2 text-xs leading-5 text-charcoal-83">
                Hoàn thiện hồ sơ để ứng viên an tâm kết nối với bạn.
              </p>
              <Link
                to="/recruiter/verification"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"
              >
                Xác thực công ty <ArrowUpRightIcon size={14} />
              </Link>
            </div>
          )}
        </div>
        <div className="workspace-sidebar-footer mt-auto space-y-1 border-t border-warm-border text-xs text-charcoal-83">
          {recruitingEnabled && invitedRecruiter && user.activeMembership && (
            <LeaveCompanyButton companyName={user.activeMembership.companyName} />
          )}
          <Link to="/vn" className="workspace-footer-link">
            <GlobeIcon size={18} /> Trang chủ GuardianWork
          </Link>
          <Link to="/jobs" className="workspace-footer-link">
            <CandidateProfileIcon size={18} /> Dành cho ứng viên
          </Link>
          {user && isStaffUser(user) && (
            <Link to="/admin" className="workspace-footer-link">
              <ArrowUpRightIcon size={18} /> Quản trị hệ thống
            </Link>
          )}
        </div>
      </aside>
      <div className="workspace-content flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-parchment-bg">
        <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-3 border-b border-warm-border bg-paper-white px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              aria-expanded={menuOpen}
              aria-controls="recruiter-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-md border border-warm-border p-2 text-charcoal-83 md:hidden"
            >
              <MenuIcon size={22} aria-hidden="true" />
            </button>
            <p className="workspace-page-title text-sm font-semibold tracking-tight [overflow-wrap:anywhere]">
              {title}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-5">
            <Link
              to="/vn"
              className="hidden items-center gap-1.5 rounded-lg border border-warm-border bg-surface-container px-3 py-1.5 text-xs font-semibold hover:bg-surface-container-high xl:flex"
            >
              <GlobeIcon size={14} className="text-primary" aria-hidden="true" /> Trang chủ
            </Link>
            {recruitingEnabled && topNavExtras}
            {recruitingEnabled && (
              <Link
                to="/recruiter/jobs"
                aria-label="Đăng tin tuyển dụng"
                search={{ create: true }}
                className="workspace-header-action"
              >
                <AddIcon size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Đăng tin tuyển dụng</span>
              </Link>
            )}
            <LogoutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="workspace-page mx-auto max-w-[1200px]">
            {user && !user.recruitingEmailEligible && <EmailVerificationPanel />}
            {user?.recruitingEmailEligible || pathname === "/recruiter/verification" ? (
              children
            ) : (
              <p className="text-sm leading-6 text-charcoal-83">
                Hoàn tất xác minh email để tiếp tục trong không gian tuyển dụng.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
