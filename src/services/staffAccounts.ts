import { authenticatedRequest, getCurrentUser, isStaffUser } from "./auth.ts";
import { ApiError } from "./api.ts";

export type AccountType = "users" | "companies";
export interface StaffAccount {
  id: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  status?: string;
  name?: string;
  taxCode?: string;
  verificationStatus?: string;
  isBanned?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  activeBan: {
    id: number;
    reason: string;
    startedAt: string;
    expiresAt: string | null;
    createdBy: number;
  } | null;
  canBan: boolean;
  canUnban: boolean;
}
export interface AccountPage {
  content: StaffAccount[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
async function request(type: AccountType, path: string, init: RequestInit = {}) {
  const user = getCurrentUser();
  if (user && !isStaffUser(user))
    throw new ApiError("Chỉ tài khoản Staff được phép truy cập.", 403);
  return authenticatedRequest(`/staff/accounts/${type}${path}`, {
    ...init,
    headers: init.body ? {} : { "Content-Type": "application/json" },
  });
}
function account(data: unknown): StaffAccount {
  const value = data as StaffAccount;
  if (
    !value ||
    !Number.isSafeInteger(value.id) ||
    typeof value.canBan !== "boolean" ||
    typeof value.canUnban !== "boolean" ||
    !(value.activeBan === null || (value.activeBan && typeof value.activeBan.reason === "string"))
  )
    throw new ApiError("Dữ liệu tài khoản không hợp lệ. Vui lòng tải lại.");
  return value;
}
export async function listStaffAccounts(
  type: AccountType,
  q: string,
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<AccountPage> {
  if (
    q.length > 200 ||
    !Number.isInteger(page) ||
    page < 0 ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new ApiError("Bộ lọc tìm kiếm không hợp lệ.", 400);
  const data = (await request(
    type,
    `?${new URLSearchParams({ q, page: String(page), size: String(size) })}`,
    { signal },
  )) as AccountPage;
  if (
    !data ||
    !Array.isArray(data.content) ||
    !Number.isInteger(data.pageNumber) ||
    !Number.isInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !Number.isInteger(data.totalPages) ||
    data.totalPages < 0
  )
    throw new ApiError("Danh sách trả về không hợp lệ. Vui lòng thử lại.");
  data.content.forEach(account);
  return data;
}
export async function getStaffAccount(type: AccountType, id: number, signal?: AbortSignal) {
  const data = account(await request(type, `/${id}`, { signal }));
  if (data.id !== id) throw new ApiError("Phản hồi tài khoản không khớp.");
  return data;
}
export async function enforceStaffAccount(
  type: AccountType,
  id: number,
  action: "ban" | "unban",
  reason: string,
  expiresAt: string | null = null,
) {
  reason = reason.trim();
  if (!reason || reason.length > 2000)
    throw new ApiError("Lý do phải có từ 1 đến 2.000 ký tự sau khi bỏ khoảng trắng.", 400);
  if (
    action === "ban" &&
    expiresAt !== null &&
    (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())
  )
    throw new ApiError("Thời điểm hết hạn phải ở tương lai.", 400);
  const data = account(
    await request(type, `/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason, ...(action === "ban" ? { expiresAt } : {}) }),
    }),
  );
  if (data.id !== id)
    throw new ApiError("Chưa xác nhận được kết quả. Tải lại chi tiết trước khi tiếp tục.");
  return data;
}
export function accountError(error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  const messages: Record<number, string> = {
    400: "Thông tin chưa hợp lệ. Kiểm tra lý do và thời điểm hết hạn rồi thử lại.",
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền thực hiện thao tác này hoặc không được tự khóa tài khoản.",
    404: "Tài khoản không còn tồn tại. Vui lòng tìm kiếm lại.",
    409: "Trạng thái đã thay đổi. Chi tiết và quyền thao tác đang được tải lại.",
    500: "Thao tác thất bại. Trạng thái hiển thị được giữ nguyên.",
    503: "Dịch vụ tạm thời gián đoạn. Tải lại chi tiết để kiểm tra kết quả trước khi thử lại.",
  };
  return {
    status,
    message:
      messages[status] ||
      "Không thể xác nhận kết quả. Kiểm tra kết nối và tải lại chi tiết trước khi thử lại.",
  };
}
