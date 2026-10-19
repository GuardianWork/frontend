import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/admin/accounts")({
  head: () => ({ meta: [{ title: "Quản lý tài khoản — Quản trị GuardianWork" }] }),
  component: () => <AdminDraftPage area="accounts" />,
});
