import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/recruit")({
  beforeLoad: () => {
    throw redirect({ to: "/recruiter" });
  },
});
