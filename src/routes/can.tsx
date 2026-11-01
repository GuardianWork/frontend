import { SidebarProvider } from "@/context/SidebarProvider";
import { useEffect } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { WorkspaceLayoutContext } from "@/context/WorkspaceLayoutContext";

export const Route = createFileRoute("/can")({ component: CandidateLayout });
function CandidateLayout() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const main = document.querySelector(".workspace-content > main");
    if (main) main.scrollTop = 0;
  }, [path]);
  const title = path.startsWith("/can/jobs/apply")
    ? "Ứng tuyển"
    : path.startsWith("/can/jobs")
      ? "Tìm việc làm"
      : path.startsWith("/can/profile")
        ? "Hồ sơ của tôi"
        : path.startsWith("/can/cvs")
          ? "Hồ sơ xin việc"
          : path.startsWith("/can/copilot")
            ? "Trợ lý pháp lý"
            : path.startsWith("/can/account")
              ? "Cài đặt tài khoản"
              : "Không gian ứng viên";
  return (
    <SidebarProvider>
      <AdminShell title={title} role="candidate">
        <WorkspaceLayoutContext.Provider value="candidate">
          <Outlet />
        </WorkspaceLayoutContext.Provider>
      </AdminShell>
    </SidebarProvider>
  );
}
