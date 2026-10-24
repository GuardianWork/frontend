import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/$")({
  beforeLoad: ({ params, location }) => {
    const known = new Set([
      "verifications",
      "jobs",
      "compliance",
      "reports",
      "accounts",
      "audit-logs",
      "candidates",
      "analytics",
      "tasks",
      "monitoring",
    ]);
    const destination = known.has(params._splat ?? "") ? `/staff/${params._splat}` : "/staff";
    throw redirect({ href: `${destination}${location.searchStr}`, replace: true });
  },
});
