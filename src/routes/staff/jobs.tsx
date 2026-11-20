import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { StaffJobsPanel } from "@/components/admin/StaffJobsPanel";
import { staffJobsSearch } from "@/lib/staff-detail-routing";

export const Route = createFileRoute("/staff/jobs")({
  validateSearch: staffJobsSearch,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tin tuyển dụng — Platform staff GuardianWork" },
    ],
  }),
  component: () => (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div id="staff-reviews">
        <StaffJobsPanel />
      </div>
    </AdminShell>
  ),
});
