import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { LogoutButton } from "./LogoutButton";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Users,
  Building2,
  Menu,
  X,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  Globe,
} from "lucide-react";

const navigation = [
  { to: "/recruiter", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/recruiter/jobs", label: "Tin tuyển dụng", icon: BriefcaseBusiness },
  { to: "/recruiter/talent", label: "Tìm kiếm ứng viên", icon: Users },
  { to: "/recruiter/applications", label: "Đơn ứng tuyển", icon: BriefcaseBusiness },
  { to: "/recruiter/members", label: "Thành viên công ty", icon: Users },
  { to: "/recruiter/verification", label: "Cài đặt tài khoản", icon: Building2 },
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
  const { member } = useCompanyWorkspace();
  const user = useAuthUser();
  const invitedRecruiter = user?.activeMembership?.companyRole === "RECRUITER";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
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
            <X size={20} aria-hidden="true" />
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
          <nav aria-label="Điều hướng nhà tuyển dụng" className="flex flex-col gap-1 px-3 pt-4">
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
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active ? "bg-surface-container font-semibold text-primary" : "font-medium text-charcoal-40 hover:bg-charcoal-04 hover:text-charcoal-text"}`}
                  >
                    <Icon size={20} className="shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            {invitedRecruiter && (
              <Link
                to="/employer-onboarding"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-charcoal-40 hover:bg-charcoal-04 hover:text-charcoal-text"
              >
                <ShieldCheck size={20} aria-hidden="true" />
                Xác thực cá nhân
              </Link>
            )}
          </nav>
          {!invitedRecruiter && (
            <div className="mx-3 mb-4 mt-6 rounded-lg bg-surface-container-low p-4">
              <ShieldCheck className="mb-3 text-primary" size={26} />
              <p className="text-sm font-semibold">Xây dựng uy tín doanh nghiệp</p>
              <p className="mt-2 text-xs leading-5 text-charcoal-83">
                Hoàn thiện hồ sơ để ứng viên an tâm kết nối với bạn.
              </p>
              <Link
                to="/recruiter/verification"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"
              >
                Xác thực công ty <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>
        <div className="mt-auto space-y-3 border-t border-warm-border p-5 text-xs text-charcoal-83">
          <Link to="/vn" className="block hover:text-primary">
            Trang chủ GuardianWork ↗
          </Link>
          <Link to="/candidate/jobs" className="block hover:text-primary">
            Dành cho ứng viên ↗
          </Link>
          <Link to="/admin" className="block hover:text-primary">
            Quản trị hệ thống ↗
          </Link>
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
              <Menu size={22} aria-hidden="true" />
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
              <Globe size={14} className="text-primary" aria-hidden="true" /> Trang chủ
            </Link>
            {topNavExtras}
            <Link
              to="/recruiter/jobs"
              aria-label="Đăng tin tuyển dụng"
              search={{ create: true }}
              className="recruiter-primary flex items-center gap-2"
            >
              <Plus size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Đăng tin tuyển dụng</span>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
