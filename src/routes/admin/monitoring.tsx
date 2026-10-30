import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/admin/monitoring")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Giám sát hệ thống — Quản trị GuardianWork" },
    ],
  }),
  component: () => <AdminDraftPage area="monitoring" />,
});
