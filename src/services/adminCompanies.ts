import { getAccessToken, getCurrentUser, isStaffUser } from "./auth";
import { getApiBaseUrl } from "./api";
import { DEFAULT_PAGE_SIZE } from "../lib/pagination.ts";

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
  constructor(
    message: string,
    public status = 0,
    public conflict = false,
  ) {
    super(message);
  }
}
async function authorization() {
  try {
    const token = await getAccessToken();
    if (!isStaffUser(getCurrentUser()))
      throw new AdminApiError("Tài khoản hiện tại không có quyền quản trị.", 403);
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    if (error instanceof AdminApiError) throw error;
    throw new AdminApiError("Không đọc được phiên đăng nhập. Vui lòng đăng nhập lại.", 401);
  }
}
async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const baseUrl = getApiBaseUrl();
  const headers = {
    ...(await authorization()),
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
  };
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/staff/companies${path}`, {
      ...init,
      headers,
      signal: init.signal || AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new AdminApiError("Không kết nối được dịch vụ xác minh. Kiểm tra kết nối và thử lại.");
  }
  let payload: { data?: unknown; message?: string; status?: number } | null = null;
  try {
    payload = await response.json();
  } catch {
    /* The server may return an HTML error. */
  }
  const status = !response.ok
    ? response.status
    : payload?.status && payload.status >= 400
      ? payload.status
      : 200;
  if (status !== 200) {
    const message = payload?.message || "";
    if (status === 409 || message.includes("CONCURRENT_MODIFICATION"))
      throw new AdminApiError(
        "Hồ sơ đã được thay đổi bởi người khác. Tải lại danh sách và mở lại hồ sơ trước khi quyết định.",
        status,
        true,
      );
    if (status === 401)
      throw new AdminApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", status);
    if (status === 403)
      throw new AdminApiError("Bạn không có quyền xem hoặc xét duyệt hồ sơ này.", status);
    if (message.includes("COMPANY_NOT_PENDING"))
      throw new AdminApiError(
        "Hồ sơ không còn ở trạng thái chờ duyệt. Vui lòng tải lại danh sách.",
        status,
        true,
      );
    if (message.includes("INVALID_REJECTION_REASON"))
      throw new AdminApiError(
        "Lý do từ chối phải dài từ 10 đến 1.000 ký tự sau khi bỏ khoảng trắng đầu và cuối.",
        status,
      );
    if (status === 404)
      throw new AdminApiError(
        "Không tìm thấy dữ liệu yêu cầu. Vui lòng tải lại danh sách hoặc thử lại sau.",
        status,
      );
    throw new AdminApiError(
      "Không thể hoàn tất yêu cầu. Dữ liệu chưa được thay đổi; vui lòng thử lại.",
      status,
    );
  }
  if (!payload || payload.data == null)
    throw new AdminApiError("Dịch vụ trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  return payload.data;
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
    `/verifications?${new URLSearchParams({ status, page: String(page), size: String(DEFAULT_PAGE_SIZE) })}`,
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
  const result = await request(`/${company.id}/${decision === "VERIFIED" ? "verify" : "reject"}`, {
    method: "PUT",
    body: JSON.stringify({
      status: decision,
      expectedVersion: company.version,
      ...(decision === "REJECTED" ? { rejectionReason: trimmedReason } : {}),
    }),
  });
  if (!isCompany(result) || result.id !== company.id || result.verificationStatus !== decision)
    throw new AdminApiError(
      "Chưa xác nhận được kết quả xét duyệt. Vui lòng tải lại danh sách trước khi tiếp tục.",
      0,
      true,
    );
  return result;
}
