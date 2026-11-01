import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rec/hub")({
  beforeLoad: () => {
    throw redirect({ to: "/rec" });
  },
});
