import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { StaffJobsPanel } from "@/components/admin/StaffJobsPanel";

export const Route = createFileRoute("/staff/jobs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tin tuyển dụng — Platform staff GuardianWork" },
    ],
  }),
  component: () => (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý tin tuyển dụng</h1>
          <p>Xét duyệt các phiên bản tin tuyển dụng đã được gửi lên hệ thống.</p>
        </div>
      </div>
      <StaffJobsPanel />
    </AdminShell>
  ),
});
