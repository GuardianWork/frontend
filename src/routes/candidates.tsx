import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/candidates")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/candidates" });
  },
});
