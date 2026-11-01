import { SidebarLabel } from "./SidebarControls";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";
import { GlobeIcon, LockIcon } from "@/components/icons";
import { useAuthUser } from "@/hooks/useAuthUser";

/** The same three destinations, in the same order, in both USER workspaces. */
export function WorkspaceFooter({
  role,
  onNavigate,
}: {
  role: "candidate" | "recruiter";
  onNavigate?: () => void;
}) {
  const user = useAuthUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (user?.role !== "USER") return null;
  const accountPath = role === "recruiter" ? "/rec/account" : "/can/account";
  return (
    <nav
      className="workspace-sidebar-footer workspace-quick-navigation"
      aria-label="Điều hướng nhanh"
    >
      <SidebarLabel label="Cài đặt tài khoản">
        <Link
          aria-label="Cài đặt tài khoản"
          to={accountPath}
          onClick={onNavigate}
          className="workspace-footer-link"
          aria-current={pathname === accountPath ? "page" : undefined}
        >
          <LockIcon size={18} />
          <span>Cài đặt tài khoản</span>
        </Link>
      </SidebarLabel>
      <SidebarLabel
        label={`Chuyển phân hệ · ${role === "recruiter" ? "Sang tìm việc" : "Sang tuyển dụng"}`}
      >
        <Link
          aria-label="Chuyển phân hệ"
          to={role === "recruiter" ? "/can/jobs" : "/rec"}
          onClick={onNavigate}
          className="workspace-footer-link"
        >
          <ArrowLeftRight size={18} aria-hidden="true" />
          <span>
            Chuyển phân hệ
            <span className="workspace-quick-navigation__hint">
              {role === "recruiter" ? "Sang tìm việc" : "Sang tuyển dụng"}
            </span>
          </span>
        </Link>
      </SidebarLabel>
      <SidebarLabel label="Trang chủ">
        <Link
          aria-label="Trang chủ"
          to="/vn"
          onClick={onNavigate}
          className="workspace-footer-link"
        >
          <GlobeIcon size={18} />
          <span>Trang chủ</span>
        </Link>
      </SidebarLabel>
    </nav>
  );
}
