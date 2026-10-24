import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/monitoring")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
});
