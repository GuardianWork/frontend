import { createFileRoute } from "@tanstack/react-router";
import { StaffReportsPage } from "@/components/admin/StaffReportsPage";
export const Route = createFileRoute("/staff/reports")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Báo cáo vi phạm — Platform staff GuardianWork" },
    ],
  }),
  component: StaffReportsPage,
});
