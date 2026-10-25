import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/tasks")({
  beforeLoad: () => {
    throw redirect({ to: "/staff" });
  },
});
