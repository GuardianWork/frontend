import { SidebarProvider } from "@/context/SidebarProvider";
import { useEffect } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { RecruiterShell } from "@/components/RecruiterShell";
import { RecruiterAccess } from "@/components/auth/RecruiterAccess";
import { WorkspaceLayoutContext } from "@/context/WorkspaceLayoutContext";

export const Route = createFileRoute("/rec")({ component: RecruiterLayout });
function RecruiterLayout() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const main = document.querySelector(".workspace-content > main");
    if (main) main.scrollTop = 0;
  }, [path]);
  const title = path.startsWith("/rec/account")
    ? "Cài đặt tài khoản"
    : path.startsWith("/rec/verification")
      ? "Hồ sơ công ty"
      : path.startsWith("/rec/members")
        ? "Thành viên công ty"
        : path.startsWith("/rec/jobs")
          ? "Tin tuyển dụng"
          : path.startsWith("/rec/applications")
            ? "Đơn ứng tuyển"
            : path.startsWith("/rec/talent")
              ? "Tìm kiếm ứng viên"
              : "Tổng quan tuyển dụng";
  return (
    <SidebarProvider>
      <RecruiterShell title={title}>
        <WorkspaceLayoutContext.Provider value="recruiter">
          <RecruiterAccess>
            <Outlet />
          </RecruiterAccess>
        </WorkspaceLayoutContext.Provider>
      </RecruiterShell>
    </SidebarProvider>
  );
}
