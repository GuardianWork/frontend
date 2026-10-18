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
  { to: "/recruiter/talent", label: "Quản lý ứng viên", icon: Users },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="recruiter-workspace min-h-screen bg-[#f3f5f7] text-slate-800">
      <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-7">
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
            <ShieldCheck className="text-emerald-600" size={30} />
            <span>
              Guardian<span className="text-emerald-600">Work</span>
            </span>
          </Link>
          <span className="hidden border-l border-slate-200 pl-6 text-sm text-slate-500 xl:block">
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
          <Link
            to="/recruiter/verification"
            aria-label="Cài đặt tài khoản"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700"
          >
            NT
          </Link>
        </div>
      </header>
      {menuOpen && (
        <button
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 top-[72px] z-20 bg-slate-900/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`${menuOpen ? "flex" : "hidden"} fixed bottom-0 left-0 top-[72px] z-30 w-60 flex-col border-r border-slate-200 bg-white lg:flex`}
      >
        <div className="mx-4 my-5 rounded-lg border border-slate-200 p-3">
          <p className="text-xs text-slate-400">KHÔNG GIAN LÀM VIỆC</p>
          <p className="mt-1 text-sm font-semibold">Nhà tuyển dụng</p>
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
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon size={19} />
                {label}
                {active && <ChevronRight size={15} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="mx-4 mt-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <ShieldCheck className="mb-3 text-emerald-600" size={26} />
          <p className="text-sm font-semibold">Xây dựng uy tín doanh nghiệp</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Hoàn thiện hồ sơ để ứng viên an tâm kết nối với bạn.
          </p>
          <Link
            to="/recruiter/verification"
            onClick={() => setMenuOpen(false)}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"
          >
            Xác thực công ty <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="mt-auto space-y-3 border-t border-slate-100 p-5 text-xs text-slate-500">
          <Link to="/vn" className="block hover:text-emerald-600">
            Trang chủ GuardianWork ↗
          </Link>
          <Link to="/candidate/jobs" className="block hover:text-emerald-600">
            Dành cho ứng viên ↗
          </Link>
          <Link to="/admin" className="block hover:text-emerald-600">
            Quản trị hệ thống ↗
          </Link>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:ml-60 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
            <span>Nhà tuyển dụng</span>
            <ChevronRight size={13} />
            <span className="text-slate-600">{title}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
