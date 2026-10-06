import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recruiter/hub")({
  beforeLoad: () => {
    throw redirect({ to: "/recruiter" });
  },
});
