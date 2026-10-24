import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/staff/compliance")({
  beforeLoad: () => {
    throw redirect({ to: "/staff/jobs", replace: true });
  },
});
