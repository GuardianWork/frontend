import { createFileRoute } from "@tanstack/react-router";
import { AdminJobsPage } from "@/components/admin/AdminJobsPage";

export const Route = createFileRoute("/admin/jobs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tin tuyển dụng — GuardianWork" },
    ],
  }),
  component: AdminJobsPage,
});
