import { createFileRoute } from "@tanstack/react-router";
import { AdminDraftPage } from "@/components/admin/AdminDraftPage";
export const Route = createFileRoute("/staff/accounts")({
  head: () => ({ meta: [{ title: "Quản lý tài khoản — Platform staff GuardianWork" }] }),
  component: () => <AdminDraftPage area="accounts" />,
});
