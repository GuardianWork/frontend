import { createFileRoute } from "@tanstack/react-router";
import { PublicJobsView } from "@/components/guardian/PublicJobsView";
import { parseJobSearch } from "@/lib/job-search";

/**
 * Public job discovery. Guests may search, filter and read listings without an
 * account (UC-CAN-07 / 08 / 09); applying still requires signing in.
 */
export const Route = createFileRoute("/jobs")({
  validateSearch: parseJobSearch,
  head: () => ({
    meta: [
      { title: "Tìm việc làm đa ngành — GuardianWork" },
      {
        name: "description",
        content:
          "Tìm việc làm theo vị trí, kỹ năng, ngành nghề, địa điểm và mức lương tại Việt Nam. Xem tin tuyển dụng không cần đăng ký.",
      },
    ],
  }),
  component: JobsSearchRoute,
});

function JobsSearchRoute() {
  const search = Route.useSearch();
  return <PublicJobsView search={search} />;
}
