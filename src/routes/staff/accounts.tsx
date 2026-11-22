import { createFileRoute } from "@tanstack/react-router";
import { StaffAccountsPage } from "@/components/admin/StaffAccountsPage";
import { staffAccountsSearch } from "@/lib/staff-detail-routing";
export const Route = createFileRoute("/staff/accounts")({
  validateSearch: staffAccountsSearch,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tài khoản — Platform staff GuardianWork" },
    ],
  }),
  component: StaffAccountsPage,
});
