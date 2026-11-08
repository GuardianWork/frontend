import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";
import type { JobStatus } from "./jobs.ts";

export class SuspendedJobError extends ApiError {
  jobId: number;
  constructor(jobId: number) {
    super("Tin tuyển dụng đã bị đình chỉ.", 403);
    this.jobId = jobId;
  }
}

export async function readRecruiterJobAccess(jobId: number, signal?: AbortSignal) {
  const job = (await authenticatedRequest(`/companies/me/jobs/${jobId}`, {
    signal,
    cache: "no-store",
  })) as { id: number; status: JobStatus };
  if (
    !job ||
    job.id !== jobId ||
    !["DRAFT", "PUBLISHED", "PAUSED", "SUSPENDED", "CLOSED", "EXPIRED"].includes(job.status)
  )
    throw new ApiError("Không thể xác nhận quyền truy cập tin tuyển dụng.");
  return job;
}

export async function assertRecruiterJobAvailable(jobId: number, signal?: AbortSignal) {
  const job = await readRecruiterJobAccess(jobId, signal);
  if (job.status === "SUSPENDED") throw new SuspendedJobError(jobId);
}
