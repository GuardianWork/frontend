import { createFileRoute } from "@tanstack/react-router";
import { parseJobSearch } from "@/lib/job-search";
import { PublicJobsView } from "@/components/guardian/PublicJobsView";
export const Route = createFileRoute("/can/jobs")({
  validateSearch: parseJobSearch,
  head: () => ({
    meta: [
      { title: "Tìm việc làm — GuardianWork" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CandidateJobsPage,
});

function CandidateJobsPage() {
  const search = Route.useSearch();
  return <PublicJobsView search={search} workspace />;
}
