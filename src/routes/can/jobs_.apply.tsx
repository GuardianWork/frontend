import { createFileRoute } from "@tanstack/react-router";
import { parseJobSearch } from "@/lib/job-search";
import { JobApplyPage } from "@/components/candidate/JobApplyPage";

interface ApplySearch {
  job?: string;
}

export const Route = createFileRoute("/can/jobs_/apply")({
  validateSearch: (search: Record<string, unknown>): ApplySearch => ({
    job: parseJobSearch(search).job,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Ứng tuyển — GuardianWork" },
      {
        name: "description",
        content:
          "Kiểm tra hồ sơ đính kèm, thông tin liên hệ và thư giới thiệu trước khi gửi đơn ứng tuyển trên GuardianWork.",
      },
    ],
  }),
  component: ApplyRoute,
});

function ApplyRoute() {
  const { job } = Route.useSearch();
  return <JobApplyPage jobId={job} />;
}
