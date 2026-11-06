import { ApiError, parseApiResponse } from "./api.ts";
import { authenticatedFetch, authenticatedRequest } from "./auth.ts";

export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ReviewStatus = "UNDER_REVIEW" | "SHORTLISTED" | "REJECTED";
export type RejectionReason =
  "QUALIFICATIONS_MISMATCH" | "EXPERIENCE_MISMATCH" | "POSITION_FILLED" | "OTHER";
export interface RecruiterApplication {
  id: string;
  candidateName: string;
  status: ApplicationStatus;
  appliedAt: string;
}
export interface InboxApplication extends RecruiterApplication {
  jobId: number;
  jobTitle: string;
}
export interface ApplicationHistory {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorUserId: number | null;
  actorName?: string | null;
  occurredAt: string;
  rejectionReason: RejectionReason | null;
  internalExplanation: string | null;
  candidateFeedback: string | null;
}
export interface ApplicationDetail extends RecruiterApplication {
  jobId: number;
  jobTitle: string;
  companyName: string;
  version: number;
  email: string | null;
  phoneNumber: string | null;
  coverLetter: string | null;
  cvFileName: string | null;
  cvContentType: string | null;
  cvFileSize: number;
  history: ApplicationHistory[];
  candidateFeedback: string | null;
}
export interface ApplicationPage {
  content: RecruiterApplication[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status === value);
}
function validRow(value: unknown): value is RecruiterApplication {
  const row = value as Partial<RecruiterApplication> | null;
  return Boolean(
    row &&
    typeof row.id === "string" &&
    row.id &&
    typeof row.candidateName === "string" &&
    isApplicationStatus(row.status) &&
    typeof row.appliedAt === "string" &&
    Number.isFinite(Date.parse(row.appliedAt)),
  );
}
function invalidResponse(): never {
  throw new ApiError("Phản hồi đơn ứng tuyển không hợp lệ. Vui lòng thử lại.");
}
function parseDetail(value: unknown): ApplicationDetail {
  const detail = value as ApplicationDetail;
  if (
    !validRow(detail) ||
    !Number.isSafeInteger(detail.version) ||
    detail.version < 0 ||
    !Number.isSafeInteger(detail.jobId) ||
    detail.jobId < 1 ||
    typeof detail.jobTitle !== "string" ||
    typeof detail.companyName !== "string" ||
    ![
      detail.email,
      detail.phoneNumber,
      detail.coverLetter,
      detail.cvFileName,
      detail.cvContentType,
      detail.candidateFeedback,
    ].every((v) => v == null || typeof v === "string") ||
    !Number.isSafeInteger(detail.cvFileSize) ||
    detail.cvFileSize < 0 ||
    !Array.isArray(detail.history) ||
    !detail.history.every(
      (event) =>
        event &&
        isApplicationStatus(event.toStatus) &&
        (event.fromStatus === null || isApplicationStatus(event.fromStatus)) &&
        typeof event.occurredAt === "string" &&
        Number.isFinite(Date.parse(event.occurredAt)) &&
        (event.actorUserId === null || Number.isSafeInteger(event.actorUserId)) &&
        [
          event.actorName,
          event.rejectionReason,
          event.internalExplanation,
          event.candidateFeedback,
        ].every((v) => v == null || typeof v === "string"),
    )
  )
    invalidResponse();
  // Do not retain personal evidence from a terminal response, even if a server sends it.
  return ["REJECTED", "WITHDRAWN"].includes(detail.status)
    ? {
        ...detail,
        email: null,
        phoneNumber: null,
        coverLetter: null,
        cvFileName: null,
        cvContentType: null,
        cvFileSize: 0,
      }
    : detail;
}
export async function listRecruiterApplications(
  jobId: number,
  search: string,
  page: number,
  signal?: AbortSignal,
  status?: ApplicationStatus,
): Promise<ApplicationPage> {
  const query = new URLSearchParams({ page: String(page), size: "20" });
  if (search.trim()) query.set("search", search.trim());
  if (status) query.set("status", status);
  const data = (await authenticatedRequest(`/companies/me/jobs/${jobId}/applications?${query}`, {
    signal,
    cache: "no-store",
  })) as ApplicationPage;
  return parseApplicationPage(data);
}
function parseApplicationPage(value: unknown): ApplicationPage {
  const data = value as ApplicationPage;
  if (
    !data ||
    !Array.isArray(data.content) ||
    !data.content.every(validRow) ||
    ![data.pageNumber, data.totalElements, data.totalPages].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    !Number.isSafeInteger(data.pageSize) ||
    data.pageSize < 1 ||
    data.pageSize > 100 ||
    typeof data.first !== "boolean" ||
    typeof data.last !== "boolean"
  )
    invalidResponse();
  return data;
}
export async function listRecruiterApplicationInbox(
  jobId: number | undefined,
  search: string,
  page: number,
  signal?: AbortSignal,
  status?: ApplicationStatus,
): Promise<Omit<ApplicationPage, "content"> & { content: InboxApplication[] }> {
  const query = new URLSearchParams({ page: String(page), size: "20" });
  if (jobId !== undefined) query.set("jobId", String(jobId));
  if (search.trim()) query.set("search", search.trim());
  if (status) query.set("status", status);
  const data = await authenticatedRequest(`/companies/me/applications?${query}`, {
    signal,
    cache: "no-store",
  });
  const result = parseApplicationPage(data);
  if (
    !result.content.every((row) => {
      const item = row as Partial<InboxApplication>;
      return (
        Number.isSafeInteger(item.jobId) && item.jobId! > 0 && typeof item.jobTitle === "string"
      );
    })
  )
    invalidResponse();
  return result as Omit<ApplicationPage, "content"> & { content: InboxApplication[] };
}
function applicationPath(jobId: number, id: string) {
  return `/companies/me/jobs/${jobId}/applications/${encodeURIComponent(id)}`;
}
export async function getRecruiterApplication(
  jobId: number,
  id: string,
  signal?: AbortSignal,
): Promise<ApplicationDetail> {
  return parseDetail(
    await authenticatedRequest(applicationPath(jobId, id), { signal, cache: "no-store" }),
  );
}
export type StatusChange =
  | { status: Exclude<ReviewStatus, "REJECTED">; version: number }
  | {
      status: "REJECTED";
      version: number;
      rejectionReason: RejectionReason;
      internalExplanation?: string;
      candidateFeedback?: string;
    };
export async function changeApplicationStatus(
  jobId: number,
  id: string,
  change: StatusChange,
): Promise<ApplicationDetail> {
  return parseDetail(
    await authenticatedRequest(`${applicationPath(jobId, id)}/status`, {
      method: "PATCH",
      body: JSON.stringify(change),
      cache: "no-store",
    }),
  );
}
export async function getApplicationPdf(
  jobId: number,
  id: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await authenticatedFetch(`${applicationPath(jobId, id)}/cv`, {
    signal,
    cache: "no-store",
    // The endpoint returns PDF bytes on success and a JSON envelope on failure.
    // PDF-only negotiation can mask an application/storage error as a 401.
    headers: { Accept: "application/pdf, application/json" },
  });
  if (!response.ok) {
    await parseApiResponse(response);
    throw new ApiError("Không thể mở CV.", response.status);
  }
  if (
    response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/pdf"
  )
    invalidResponse();
  const blob = await response.blob();
  if (blob.size === 0 || blob.size > 10 * 1024 * 1024) invalidResponse();
  return blob;
}
