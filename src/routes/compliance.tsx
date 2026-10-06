import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compliance")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/compliance" });
  },
});
