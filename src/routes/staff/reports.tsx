import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/staff/reports")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Báo cáo vi phạm — Platform staff GuardianWork" },
    ],
  }),
  component: () => <AdminDraftPage area="reports" />,
});
