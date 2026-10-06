import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recruiter/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/recruiter/talent" });
  },
});
