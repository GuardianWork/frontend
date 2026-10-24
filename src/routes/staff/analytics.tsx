import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
});
