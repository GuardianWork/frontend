import { authenticatedRequest, getCurrentUser, isStaffUser } from "./auth.ts";
import { ApiError } from "./api.ts";
export const VERIFICATION_PAGE_SIZE = 20;

export type VerificationStatus = "REGISTERED" | "PENDING" | "VERIFIED" | "REJECTED";
export type VerificationFilter = "PENDING" | "VERIFIED" | "REJECTED" | "ALL";
export interface AdminCompany {
  id: number;
  name: string;
  taxCode: string;
  email: string | null;
  registrationCertificateUrl: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedBy: number | null;
  verifiedAt: string | null;
  version: number;
  createdAt: string | null;
  processingStatus?: "PENDING" | "CHECKED";
  reviewOutcome?: "VERIFIED" | "REJECTED" | null;
}
export interface VerificationPage {
  content: AdminCompany[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export class AdminApiError extends Error {
  status: number;
  conflict: boolean;
  constructor(message: string, status = 0, conflict = false) {
    super(message);
    this.status = status;
    this.conflict = conflict;
  }
}
export function staffError(error: unknown): AdminApiError {
  if (error instanceof AdminApiError) return error;
  const status = error instanceof ApiError ? error.status : 0;
  const message = error instanceof Error ? error.message : "";
  if (status === 401)
    return new AdminApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", status);
  if (status === 403)
    return new AdminApiError(
      "Bạn không có quyền truy cập. Kiểm tra tài khoản Staff và cấu hình cổng truy cập.",
      status,
    );
  if (status === 409 || message.includes("CONCURRENT_MODIFICATION"))
    return new AdminApiError(
      "Hồ sơ đã được thay đổi bởi người khác. Tải lại danh sách và mở lại hồ sơ trước khi quyết định.",
      status,
      true,
    );
  if (message.includes("COMPANY_NOT_PENDING"))
    return new AdminApiError("Hồ sơ đã được xét duyệt. Vui lòng tải lại danh sách.", status, true);
  if (message.includes("INVALID_REJECTION_REASON"))
    return new AdminApiError("Lý do từ chối phải dài từ 10 đến 1.000 ký tự.", status);
  if (message.includes("DOCUMENT_UNAVAILABLE"))
    return new AdminApiError("Tài liệu xác minh không còn khả dụng.", status);
  if (status === 404)
    return new AdminApiError(
      "Công ty hoặc dữ liệu không còn khả dụng. Vui lòng tải lại danh sách.",
      status,
      true,
    );
  if (status === 400)
    return new AdminApiError(
      "Dữ liệu yêu cầu không hợp lệ. Kiểm tra lý do, phiên bản và bộ lọc.",
      status,
    );
  return new AdminApiError(
    "Không thể hoàn tất yêu cầu. Vui lòng tải lại dữ liệu và thử lại.",
    status,
  );
}
async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  try {
    if (!isStaffUser(getCurrentUser()) && getCurrentUser())
      throw new AdminApiError("Tài khoản hiện tại không có quyền truy cập Staff.", 403);
    return await authenticatedRequest(`/staff/companies${path}`, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw staffError(error);
  }
}
function isCompany(value: unknown): value is AdminCompany {
  if (!value || typeof value !== "object") return false;
  const item = value as AdminCompany;
  return (
    Number.isSafeInteger(item.id) &&
    typeof item.name === "string" &&
    typeof item.taxCode === "string" &&
    Number.isSafeInteger(item.version) &&
    ["REGISTERED", "PENDING", "VERIFIED", "REJECTED"].includes(item.verificationStatus)
  );
}
export async function getAdminVerifications(
  status: VerificationFilter,
  page: number,
  signal?: AbortSignal,
): Promise<VerificationPage> {
  const data = await request(
    `/verifications?${new URLSearchParams({ status, page: String(page), size: String(VERIFICATION_PAGE_SIZE) })}`,
    { signal },
  );
  const result = data as VerificationPage;
  if (
    !result ||
    !Array.isArray(result.content) ||
    !result.content.every(isCompany) ||
    !Number.isInteger(result.pageNumber) ||
    !Number.isInteger(result.totalPages) ||
    !Number.isInteger(result.totalElements) ||
    result.totalElements < 0 ||
    result.totalPages < 0
  )
    throw new AdminApiError("Danh sách hồ sơ trả về không hợp lệ. Vui lòng thử lại.");
  return result;
}
export async function decideAdminVerification(
  company: AdminCompany,
  decision: "VERIFIED" | "REJECTED",
  reason = "",
): Promise<AdminCompany> {
  if (company.verificationStatus !== "PENDING")
    throw new AdminApiError("Chỉ có thể xét duyệt hồ sơ đang chờ duyệt.");
  const trimmedReason = reason.trim();
  if (decision === "REJECTED" && (trimmedReason.length < 10 || trimmedReason.length > 1000))
    throw new AdminApiError("Lý do từ chối phải dài từ 10 đến 1.000 ký tự.");
  let result: unknown;
  try {
    result = await request(`/${company.id}/verify`, {
      method: "PUT",
      body: JSON.stringify({
        status: decision,
        expectedVersion: company.version,
        ...(decision === "REJECTED" ? { rejectionReason: trimmedReason } : {}),
      }),
    });
  } catch (error) {
    const mapped = staffError(error);
    // A lost response may follow a committed decision. Require fresh state before retry.
    if (mapped.status === 0 || mapped.status >= 500) mapped.conflict = true;
    throw mapped;
  }
  if (!isCompany(result) || result.id !== company.id || result.verificationStatus !== decision)
    throw new AdminApiError(
      "Chưa xác nhận được kết quả xét duyệt. Vui lòng tải lại danh sách trước khi tiếp tục.",
      0,
      true,
    );
  return result;
}
