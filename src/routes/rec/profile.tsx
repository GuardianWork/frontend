import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rec/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/rec/verification" });
  },
});
