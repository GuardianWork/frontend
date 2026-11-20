import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { StaffJobsPanel } from "@/components/admin/StaffJobsPanel";
import { requireStaffDetailId, staffJobsSearch } from "@/lib/staff-detail-routing";

export const Route = createFileRoute("/staff/jobs_/$revisionId")({
  validateSearch: staffJobsSearch,
  beforeLoad: ({ params }) => requireStaffDetailId(params.revisionId),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Chi tiết tin tuyển dụng — Platform staff GuardianWork" },
    ],
  }),
  component: StaffJobDetailRoute,
});

function StaffJobDetailRoute() {
  const { revisionId } = Route.useParams();
  return (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div id="staff-reviews">
        <StaffJobsPanel revisionId={Number(revisionId)} />
      </div>
    </AdminShell>
  );
}
