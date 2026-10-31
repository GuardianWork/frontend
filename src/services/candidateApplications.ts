import { authenticatedRequest } from "./auth.ts";
import { ApiError } from "./api.ts";

export interface ApplicationFormPrefill {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface SubmittedApplication {
  id: string;
  jobId: number;
  jobTitle: string;
  companyId: number;
  companyName: string;
  status: string;
  appliedAt: string;
  cvFileName: string;
}

export function parseSubmittedApplication(value: unknown): SubmittedApplication {
  const application = value as Partial<SubmittedApplication>;
  if (!application || typeof application.id !== "string") {
    throw new ApiError("Phản hồi đơn ứng tuyển không hợp lệ. Vui lòng thử lại.", 500);
  }
  return {
    id: application.id,
    jobId: Number(application.jobId ?? 0),
    jobTitle: String(application.jobTitle ?? ""),
    companyId: Number(application.companyId ?? 0),
    companyName: String(application.companyName ?? ""),
    status: String(application.status ?? "SUBMITTED"),
    appliedAt: String(application.appliedAt ?? new Date().toISOString()),
    cvFileName: String(application.cvFileName ?? ""),
  };
}

export interface SubmitApplicationInput {
  jobId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  coverLetter?: string | null;
  cvId: string;
}

export async function listApplications(): Promise<SubmittedApplication[]> {
  const data = await authenticatedRequest("/candidate/applications");
  if (!Array.isArray(data)) return [];
  return data.map(parseSubmittedApplication);
}

export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<SubmittedApplication> {
  const payload: Record<string, unknown> = {
    jobId: input.jobId,
    fullName: input.fullName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    cvId: input.cvId,
  };
  if (input.coverLetter) payload.coverLetter = input.coverLetter;

  const data = await authenticatedRequest("/candidate/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseSubmittedApplication(data);
}
