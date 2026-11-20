import { createFileRoute, notFound } from "@tanstack/react-router";
import { StaffAccountsPage } from "@/components/admin/StaffAccountsPage";
import { requireStaffDetailId, staffAccountsSearch } from "@/lib/staff-detail-routing";

export const Route = createFileRoute("/staff/accounts_/$accountType/$accountId")({
  validateSearch: staffAccountsSearch,
  beforeLoad: ({ params }) => {
    requireStaffDetailId(params.accountId);
    if (params.accountType !== "users" && params.accountType !== "companies") throw notFound();
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Chi tiết tài khoản — Platform staff GuardianWork" },
    ],
  }),
  component: StaffAccountDetailRoute,
});

function StaffAccountDetailRoute() {
  const { accountType, accountId } = Route.useParams();
  return (
    <StaffAccountsPage
      accountType={accountType === "companies" ? "companies" : "users"}
      accountId={Number(accountId)}
    />
  );
}
