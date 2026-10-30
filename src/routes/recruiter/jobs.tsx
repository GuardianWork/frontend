import { createFileRoute } from "@tanstack/react-router";
import { RecruiterJobsPage } from "@/components/recruiter/RecruiterJobsPage";

export const Route = createFileRoute("/recruiter/jobs")({
  validateSearch: (search: Record<string, unknown>): { create?: boolean; jobId?: number } => ({
    create: search.create === true || search.create === "true" ? true : undefined,
    jobId:
      Number.isSafeInteger(Number(search.jobId)) && Number(search.jobId) > 0
        ? Number(search.jobId)
        : undefined,
  }),
  head: () => ({ meta: [{ title: "Tin tuyển dụng — GuardianWork Recruiter" }] }),
  component: RecruiterJobsPage,
});
