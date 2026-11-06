import { createFileRoute } from "@tanstack/react-router";
import { RecruiterOverview } from "@/components/RecruiterOverview";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/rec/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Tổng quan tuyển dụng — GuardianWork" },
      {
        name: "description",
        content: "Quản lý tin tuyển dụng, xử lý đơn ứng tuyển và theo dõi hồ sơ công ty.",
      },
    ],
  }),
  component: RecruiterIndexPage,
});

function RecruiterIndexPage() {
  return (
    <AdminShell title="Tổng quan" role="recruiter">
      <RecruiterOverview />
    </AdminShell>
  );
}
