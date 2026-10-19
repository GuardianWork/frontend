import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/admin/tasks")({
  head: () => ({ meta: [{ title: "Tác vụ nền — Quản trị GuardianWork" }] }),
  component: () => <AdminDraftPage area="tasks" />,
});
