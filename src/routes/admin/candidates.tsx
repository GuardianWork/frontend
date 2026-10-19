import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/candidates")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/accounts" });
  },
});
