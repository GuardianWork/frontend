import { createFileRoute } from "@tanstack/react-router";
import { jobStatusLabels, type JobStatus } from "@/services/jobs";
import { RecruiterJobsPage } from "@/components/recruiter/RecruiterJobsPage";

export const Route = createFileRoute("/rec/jobs")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    create?: boolean;
    jobId?: number;
    keyword?: string;
    status?: JobStatus;
    needsReassignment?: boolean;
    page?: number;
  } => ({
    keyword:
      typeof search.keyword === "string"
        ? [...search.keyword.trim()].slice(0, 200).join("") || undefined
        : undefined,
    status:
      typeof search.status === "string" && Object.hasOwn(jobStatusLabels, search.status)
        ? (search.status as JobStatus)
        : undefined,
    needsReassignment:
      search.needsReassignment === true || search.needsReassignment === "true" ? true : undefined,
    page:
      Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0
        ? Number(search.page)
        : undefined,
    create: search.create === true || search.create === "true" ? true : undefined,
    jobId:
      Number.isSafeInteger(Number(search.jobId)) && Number(search.jobId) > 0
        ? Number(search.jobId)
        : undefined,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Tin tuyển dụng — GuardianWork Recruiter" },
    ],
  }),
  component: RecruiterJobsPage,
});
