import { createFileRoute } from "@tanstack/react-router";
import { StaffAccountsPage } from "@/components/admin/StaffAccountsPage";
export const Route = createFileRoute("/staff/accounts")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tài khoản — Platform staff GuardianWork" },
    ],
  }),
  component: StaffAccountsPage,
});
