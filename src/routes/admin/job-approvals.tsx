import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/job-approvals")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/jobs", replace: true });
  },
});
