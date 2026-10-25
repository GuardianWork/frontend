import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Building2,
  Flag,
  Globe,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { StaffAccount } from "./admin/StaffAccount";
import { publicPortalHref } from "@/lib/portal";
import "./admin/sidebar.css";

const NAVIGATION = [
  { to: "/staff", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/staff/verifications", label: "Xác minh công ty", icon: Building2 },
  { to: "/staff/jobs", label: "Quản lý tin tuyển dụng", icon: BriefcaseBusiness },
  { to: "/staff/reports", label: "Báo cáo vi phạm", icon: Flag },
  { to: "/staff/accounts", label: "Quản lý tài khoản", icon: Users },
];

export function StaffShell({
  title,
  topNavExtras,
  children,
}: {
  title: string;
  topNavExtras?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <div className="admin-workspace workspace-shell flex h-dvh w-full overflow-hidden bg-background text-charcoal-text">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Đóng điều hướng"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`${open ? "flex" : "hidden"} workspace-sidebar fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-warm-border bg-paper-white md:static md:flex md:shrink-0`}
      >
        <div className="workspace-brand border-b border-warm-border">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
              <ShieldCheck size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <strong className="text-lg font-semibold tracking-tight text-primary">
                GuardianWork
              </strong>
              <p className="text-xs text-charcoal-40">Platform staff</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-navigation-close md:hidden"
            aria-label="Đóng điều hướng"
            onClick={() => setOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col overflow-y-auto">
          {NAVIGATION.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="staff-nav-link"
              aria-current={
                (
                  to === "/staff"
                    ? pathname === to || pathname === "/staff/"
                    : pathname.startsWith(to)
                )
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <span className="staff-nav-icon">
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="staff-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-warm-border">
          <a href={publicPortalHref()} className="flex items-center text-sm">
            <Globe size={18} aria-hidden="true" />
            <span>Trang chủ GuardianWork</span>
          </a>
        </div>
      </aside>
      <div className="workspace-content flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-parchment-bg">
        <header className="flex shrink-0 items-center justify-between border-b border-warm-border bg-paper-white px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-warm-border p-2 md:hidden"
              aria-label="Mở điều hướng"
              aria-controls="workspace-navigation"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <p className="workspace-page-title min-w-0">{title}</p>
          </div>
          <div className="flex items-center gap-3">
            {topNavExtras}
            <StaffAccount />
            <LogoutButton />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
