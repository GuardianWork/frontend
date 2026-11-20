import { createFileRoute } from "@tanstack/react-router";
import { AdminVerificationsPage } from "./verifications";
import { requireStaffDetailId, staffVerificationsSearch } from "@/lib/staff-detail-routing";

export const Route = createFileRoute("/staff/verifications_/$companyId")({
  validateSearch: staffVerificationsSearch,
  beforeLoad: ({ params }) => {
    if (!/^sample-[1-4]$/.test(params.companyId)) requireStaffDetailId(params.companyId);
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Chi tiết hồ sơ xác minh — Platform staff GuardianWork" },
    ],
  }),
  component: VerificationDetailRoute,
});

function VerificationDetailRoute() {
  const { companyId } = Route.useParams();
  return (
    <AdminVerificationsPage
      companyId={companyId.startsWith("sample-") ? -Number(companyId.slice(7)) : Number(companyId)}
    />
  );
}
