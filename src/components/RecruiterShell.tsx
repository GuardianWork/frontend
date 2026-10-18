import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { LogoutButton } from "./LogoutButton";
import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Users,
  Building2,
  Menu,
  X,
  Plus,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="recruiter-workspace min-h-screen bg-parchment-bg text-charcoal-text">
      <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-3 border-b border-warm-border bg-paper-white px-4 lg:px-7">
        <div className="flex items-center gap-3 lg:gap-10">
          <button
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link
            to="/recruiter"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
          >
            <ShieldCheck className="text-primary" size={30} />
            <span>
              Guardian<span className="text-primary">Work</span>
            </span>
          </Link>
          <span className="hidden border-l border-warm-border pl-6 text-sm text-charcoal-83 xl:block">
            Nền tảng tuyển dụng dành cho doanh nghiệp
          </span>
        </div>
        <div className="flex items-center gap-4">
          {topNavExtras}
          <Link
            to="/recruiter/jobs"
            search={{ create: true }}
            className="recruiter-primary flex items-center gap-2"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Đăng tin tuyển dụng</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      {menuOpen && (
        <button
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 top-[72px] z-20 bg-primary/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`${menuOpen ? "flex" : "hidden"} fixed bottom-0 left-0 top-[72px] z-30 w-60 flex-col border-r border-warm-border bg-paper-white lg:flex`}
      >
        <div className="mx-4 my-5 rounded-lg border border-warm-border p-3">
          <p className="text-xs text-charcoal-40">KHÔNG GIAN LÀM VIỆC</p>
          <p className="mt-1 text-sm font-semibold">{member?.role || "Nhà tuyển dụng"}</p>
        </div>
        <nav aria-label="Điều hướng nhà tuyển dụng" className="space-y-1 px-3">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/recruiter" ? pathname.replace(/\/$/, "") === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active ? "bg-surface-container text-primary" : "text-charcoal-83 hover:bg-surface-container-low hover:text-charcoal-text"}`}
              >
                <Icon size={19} />
                {label}
                {active && <ChevronRight size={15} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="mx-4 mt-8 rounded-xl bg-surface-container-low p-4">
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
      <main className="min-w-0 p-4 sm:p-6 lg:ml-60 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-center gap-2 text-xs text-charcoal-40">
            <span>Nhà tuyển dụng</span>
            <ChevronRight size={13} />
            <span className="text-charcoal-83">{title}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
