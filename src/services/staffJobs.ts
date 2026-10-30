import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";
import type { ApiPage, JobContent, JobStatus, RevisionState } from "./jobs.ts";

export type ReviewState = Exclude<RevisionState, "DRAFT">;
export type ReviewFilter = ReviewState | "ALL";
export interface StaffJobReview {
  id: number;
  jobId: number;
  companyId: number;
  revisionNumber: number;
  state: ReviewState;
  jobVersion: number;
  revisionVersion: number;
  content: JobContent;
  submitterUserId: number | null;
  submittedAt: string | null;
  reviewerUserId: number | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  withdrawerUserId: number | null;
  withdrawnAt: string | null;
  companyVerified: boolean;
  companySuspended: boolean;
  needsReassignment: boolean;
  approvalEligible: boolean;
  validationIssues: { field: string; code: string }[];
}
export interface StaffDecisionReceipt {
  jobId: number;
  revisionId: number;
  outcome: "APPROVED" | "REJECTED";
  publicationStatus: JobStatus;
  jobVersion: number;
  revisionVersion: number;
}
const root = "/staff/job-revisions";
export const REVIEW_PAGE_SIZE = 20;
const invalidResponse = () =>
  new ApiError("Phản hồi duyệt tin không hợp lệ. Vui lòng tải lại dữ liệu.");
const positiveId = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;
const version = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
function parseReview(value: unknown): StaffJobReview {
  const review = value as StaffJobReview | null;
  if (
    !review ||
    !positiveId(review.id) ||
    !positiveId(review.jobId) ||
    !positiveId(review.companyId) ||
    !positiveId(review.revisionNumber) ||
    !version(review.jobVersion) ||
    !version(review.revisionVersion) ||
    !["PENDING_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"].includes(review.state) ||
    !review.content ||
    typeof review.content !== "object" ||
    Array.isArray(review.content) ||
    ![
      review.companyVerified,
      review.companySuspended,
      review.needsReassignment,
      review.approvalEligible,
    ].every((flag) => typeof flag === "boolean") ||
    !Array.isArray(review.validationIssues) ||
    !review.validationIssues.every(
      (issue) => issue && typeof issue.field === "string" && typeof issue.code === "string",
    )
  )
    throw invalidResponse();
  return review;
}
async function requestPage(path: string): Promise<ApiPage<StaffJobReview>> {
  const page = (await authenticatedRequest(path, { cache: "no-store" })) as ApiPage<unknown> | null;
  if (
    !page ||
    !Array.isArray(page.content) ||
    !version(page.pageNumber) ||
    !positiveId(page.pageSize) ||
    !version(page.totalElements) ||
    !version(page.totalPages)
  )
    throw invalidResponse();
  return { ...page, content: page.content.map(parseReview) };
}
export const listStaffJobReviews = (status: ReviewFilter, page = 0) =>
  requestPage(
    `${root}?${new URLSearchParams({ status, page: String(page), size: String(REVIEW_PAGE_SIZE) })}`,
  );
export async function getStaffJobReview(id: number) {
  const review = parseReview(await authenticatedRequest(`${root}/${id}`, { cache: "no-store" }));
  if (review.id !== id) throw invalidResponse();
  return review;
}
export const staffJobHistory = (jobId: number, page = 0) =>
  requestPage(`/staff/jobs/${jobId}/revisions?page=${page}&size=${REVIEW_PAGE_SIZE}`);
export async function decideStaffJobReview(
  review: StaffJobReview,
  outcome: StaffDecisionReceipt["outcome"],
  reason: string,
): Promise<StaffDecisionReceipt> {
  const trimmed = reason.trim();
  if (
    outcome === "REJECTED" &&
    (Array.from(trimmed).length < 10 || Array.from(trimmed).length > 1000)
  )
    throw new ApiError("Lý do từ chối cần từ 10 đến 1.000 ký tự.", 400);
  const receipt = (await authenticatedRequest(`${root}/${review.id}/decision`, {
    method: "PUT",
    body: JSON.stringify({
      expectedJobVersion: review.jobVersion,
      expectedRevisionVersion: review.revisionVersion,
      outcome,
      reason: trimmed || null,
    }),
  })) as StaffDecisionReceipt | null;
  if (
    !receipt ||
    receipt.jobId !== review.jobId ||
    receipt.revisionId !== review.id ||
    receipt.outcome !== outcome ||
    !version(receipt.jobVersion) ||
    !version(receipt.revisionVersion) ||
    !["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "EXPIRED"].includes(receipt.publicationStatus)
  )
    throw invalidResponse();
  return receipt;
}
export function staffJobError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Bạn không có quyền xử lý tin này hoặc công ty đã bị đình chỉ. Hãy tải lại dữ liệu.";
    if (error.status === 404)
      return "Bản tin không còn khả dụng. Hãy quay lại danh sách và tải lại.";
    if (error.message.includes("40022") || error.status === 409)
      return "Trạng thái hoặc điều kiện duyệt đã thay đổi. Lý do đã nhập vẫn được giữ. Hãy tải lại bản tin trước khi tiếp tục.";
    if (error.status === 400)
      return "Thông tin quyết định chưa hợp lệ. Lý do từ chối cần từ 10 đến 1.000 ký tự. Hãy tải lại bản tin trước khi thử lại.";
  }
  return "Không thể xác nhận kết quả từ hệ thống. Hãy kiểm tra kết nối và tải lại dữ liệu trước khi tiếp tục.";
}
