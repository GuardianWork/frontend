import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseJobSearch } from "@/lib/job-search";

/**
 * Candidate and guest job search are one surface now. Keep the old candidate URL
 * working by forwarding its filters to the public job browser.
 */
export const Route = createFileRoute("/candidate/jobs")({
  validateSearch: parseJobSearch,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/jobs", search });
  },
});
