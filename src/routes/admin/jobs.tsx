import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/admin/jobs")({
  head: () => ({ meta: [{ title: "Kiểm soát tin tuyển dụng — Quản trị GuardianWork" }] }),
  component: () => <AdminDraftPage area="jobs" />,
});
