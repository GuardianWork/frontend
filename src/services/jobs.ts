import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "EXPIRED";
export type RevisionState = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN";
export interface ScreeningQuestion {
  key: string;
  type: "SHORT_TEXT" | "SINGLE_CHOICE" | "YES_NO" | "NUMERIC";
  prompt: string;
  required: boolean;
  options?: string[];
}
export interface JobContent {
  title?: string;
  description?: string;
  responsibilities?: string;
  requiredQualifications?: string;
  preferredQualifications?: string;
  experienceExpectations?: string;
  benefits?: string;
  location?: string;
  applicationInstructions?: string;
  employmentType?: string;
  workArrangement?: string;
  deadline?: string;
  headcount?: number;
  compensation?: {
    disclosed: boolean;
    minimum?: number;
    maximum?: number;
    currency?: "VND" | "USD";
    payPeriod?: "HOUR" | "DAY" | "MONTH" | "YEAR";
  };
  screeningQuestions?: ScreeningQuestion[];
}
export interface JobRevision {
  id: number;
  revisionNumber: number;
  state: RevisionState;
  version: number;
  content: JobContent;
}
export interface Job {
  id: number;
  companyId: number;
  creatorUserId: number;
  status: JobStatus;
  version: number;
  ownerResponsible: boolean;
  needsReassignment: boolean;
  workingRevision: JobRevision | null;
  publishedRevisionId: number | null;
  approvedDeadline: string | null;
  assignments: {
    id: number;
    membershipId: number;
    membershipJoinedAt: string;
    assignedAt: string;
  }[];
  availableActions: string[];
  createdAt: string;
  updatedAt: string;
}
export interface RevisionHistory extends JobRevision {
  createdAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  withdrawnAt: string | null;
  rejectionReason: string | null;
}
export interface JobPreview {
  content: JobContent;
  jobVersion: number;
  revisionVersion: number;
  submissionEligible: boolean;
  validationIssues: { field: string; code: string }[];
}
export interface JobMember {
  membershipId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  companyRole: string;
  status: string;
  joinedAt: string;
}
export interface ApiPage<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

const root = "/companies/me/jobs";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await authenticatedRequest(path, { cache: "no-store", ...init })) as T;
}
function parseJob(value: unknown): Job {
  const job = value as Job | null;
  const revision = job?.workingRevision;
  if (
    !job ||
    !Number.isSafeInteger(job.id) ||
    job.id <= 0 ||
    !Number.isSafeInteger(job.version) ||
    job.version < 0 ||
    !["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "EXPIRED"].includes(job.status) ||
    typeof job.ownerResponsible !== "boolean" ||
    typeof job.needsReassignment !== "boolean" ||
    !Array.isArray(job.assignments) ||
    !job.assignments.every(
      (a) => a && Number.isSafeInteger(a.membershipId) && typeof a.membershipJoinedAt === "string",
    ) ||
    !Array.isArray(job.availableActions) ||
    !job.availableActions.every((a) => typeof a === "string") ||
    !(
      revision === null ||
      (revision &&
        Number.isSafeInteger(revision.id) &&
        Number.isSafeInteger(revision.version) &&
        ["DRAFT", "PENDING_REVIEW"].includes(revision.state) &&
        revision.content &&
        typeof revision.content === "object" &&
        !Array.isArray(revision.content))
    )
  ) {
    throw new ApiError("Phản hồi tin tuyển dụng không hợp lệ. Hãy tải lại để kiểm tra kết quả.");
  }
  return job;
}
async function requestJob(path: string, init?: RequestInit) {
  return parseJob(await request<unknown>(path, init));
}
function mutateJob(path: string, method: string, body: unknown) {
  return requestJob(path, { method, body: JSON.stringify(body) });
}
async function requestPage<T>(path: string): Promise<ApiPage<T>> {
  const page = await request<ApiPage<T> | null>(path);
  if (
    !page ||
    !Array.isArray(page.content) ||
    !page.content.every((item) => item && typeof item === "object") ||
    !Number.isSafeInteger(page.totalElements) ||
    page.totalElements < 0 ||
    !Number.isSafeInteger(page.totalPages) ||
    page.totalPages < 0 ||
    !Number.isSafeInteger(page.pageNumber) ||
    page.pageNumber < 0
  ) {
    throw new ApiError("Phản hồi danh sách không hợp lệ. Vui lòng tải lại.");
  }
  return page;
}
export async function listJobs(page: number, status: string, needsReassignment: boolean) {
  const search = new URLSearchParams({ page: String(page), size: "20" });
  if (status) search.set("status", status);
  if (needsReassignment) search.set("needsReassignment", "true");
  const result = await requestPage<Job>(`${root}?${search}`);
  return { ...result, content: result.content.map(parseJob) };
}
export const getJob = (id: number) => requestJob(`${root}/${id}`);
export const createJob = (content: JobContent) => mutateJob(root, "POST", { content });
export function saveJob(job: Job, content: JobContent) {
  return mutateJob(`${root}/${job.id}/draft`, "PUT", {
    expectedJobVersion: job.version,
    expectedRevisionVersion: job.workingRevision?.version,
    content,
  });
}
export async function previewJob(id: number): Promise<JobPreview> {
  const preview = await request<JobPreview | null>(`${root}/${id}/draft/preview`);
  if (
    !preview ||
    !preview.content ||
    typeof preview.content !== "object" ||
    !Number.isSafeInteger(preview.jobVersion) ||
    !Number.isSafeInteger(preview.revisionVersion) ||
    typeof preview.submissionEligible !== "boolean" ||
    !Array.isArray(preview.validationIssues) ||
    !preview.validationIssues.every(
      (issue) => issue && typeof issue.field === "string" && typeof issue.code === "string",
    )
  ) {
    throw new ApiError("Phản hồi xem trước không hợp lệ. Hãy tải lại trước khi gửi duyệt.");
  }
  return preview;
}
export function submitJob(job: Job, preview: JobPreview) {
  return mutateJob(`${root}/${job.id}/revisions/${job.workingRevision!.id}/submit`, "POST", {
    expectedJobVersion: preview.jobVersion,
    expectedRevisionVersion: preview.revisionVersion,
    confirmed: true,
  });
}
export function withdrawJob(job: Job) {
  return mutateJob(`${root}/${job.id}/revisions/${job.workingRevision!.id}/withdraw`, "POST", {
    expectedJobVersion: job.version,
    expectedRevisionVersion: job.workingRevision!.version,
    confirmed: true,
  });
}
export const deriveJob = (job: Job) =>
  mutateJob(`${root}/${job.id}/draft`, "POST", { expectedJobVersion: job.version });
export const changeJobStatus = (job: Job, action: "pause" | "resume" | "close") =>
  mutateJob(`${root}/${job.id}/${action}`, "POST", { expectedJobVersion: job.version });
export const setOwnerResponsibility = (job: Job, responsible: boolean) =>
  mutateJob(`${root}/${job.id}/owner-responsibility`, "PUT", {
    expectedJobVersion: job.version,
    responsible,
  });
export function setJobAssignment(job: Job, membershipId: number, assigned: boolean) {
  return assigned
    ? mutateJob(`${root}/${job.id}/assignments/${membershipId}`, "PUT", {
        expectedJobVersion: job.version,
      })
    : requestJob(
        `${root}/${job.id}/assignments/${membershipId}?expectedJobVersion=${job.version}`,
        { method: "DELETE" },
      );
}
export const jobHistory = (id: number, page = 0, size = 20) =>
  requestPage<RevisionHistory>(`${root}/${id}/revisions?page=${page}&size=${size}`);
// A job without a working revision has no content in the list projection.
export async function latestJobRevision(id: number) {
  const first = await jobHistory(id, 0, 1);
  if (first.totalPages <= 1) return first.content[0] ?? null;
  return (await jobHistory(id, first.totalPages - 1, 1)).content[0] ?? null;
}
export const listJobMembers = (page = 0) =>
  requestPage<JobMember>(`/companies/me/members?page=${page}&size=20`);

export const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Chưa xuất bản",
  PUBLISHED: "Đang công khai",
  PAUSED: "Tạm dừng",
  CLOSED: "Đã đóng",
  EXPIRED: "Hết hạn",
};
export const revisionLabels: Record<RevisionState, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  WITHDRAWN: "Đã rút",
};
export function jobError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Bạn không có quyền thực hiện thao tác này. Hãy kiểm tra tư cách thành viên công ty.";
    if (error.status === 404)
      return "Tin hoặc thành viên không còn khả dụng trong phạm vi quyền của bạn. Hãy tải lại dữ liệu.";
    if (error.message.includes("40022"))
      return "Tin đã được người khác cập nhật. Nội dung đang nhập vẫn được giữ. Hãy sao chép nội dung cần giữ trước khi tải lại dữ liệu mới.";
    if (error.message.includes("40980"))
      return "Cần có người phụ trách trước khi gửi duyệt. Hãy nhờ chủ sở hữu phân công.";
    if (error.message.includes("40981"))
      return "Hạn ứng tuyển đã qua. Hãy cập nhật hạn trong bản nháp.";
    if (error.message.includes("40982"))
      return "Công ty cần được xác thực trước khi gửi duyệt hoặc tiếp tục đăng tin.";
    if (error.status === 409)
      return "Trạng thái tin đã thay đổi. Hãy tải lại dữ liệu trước khi tiếp tục.";
    if (error.status === 400)
      return "Nội dung chưa hợp lệ. Hãy kiểm tra các trường, độ dài và khoảng lương rồi thử lại.";
  }
  return "Không thể xác nhận kết quả. Hãy kiểm tra kết nối và tải lại dữ liệu trước khi thử lại.";
}
