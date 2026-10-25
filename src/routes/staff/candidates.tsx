import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/staff/candidates")({
  beforeLoad: () => {
    throw redirect({ to: "/staff/accounts" });
  },
});
