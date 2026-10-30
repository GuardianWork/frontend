import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Báo cáo vi phạm — Quản trị GuardianWork" },
    ],
  }),
  component: () => <AdminDraftPage area="reports" />,
});
