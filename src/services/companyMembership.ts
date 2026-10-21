import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export async function leaveCompany(): Promise<void> {
  const result = (await authenticatedRequest("/companies/me/membership/leave", {
    method: "POST",
    cache: "no-store",
  })) as { membershipId?: number; status?: string; endedAt?: string } | null;
  if (
    !result ||
    !Number.isSafeInteger(result.membershipId) ||
    result.status !== "LEFT" ||
    typeof result.endedAt !== "string" ||
    !Number.isFinite(Date.parse(result.endedAt))
  ) {
    throw new ApiError(
      "Chưa xác nhận được kết quả rời công ty. Vui lòng tải lại trang để kiểm tra trạng thái thành viên.",
    );
  }
}

export function leaveCompanyError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (cause.status === 403)
      return "Bạn không còn là thành viên hoặc không có quyền rời công ty. Vui lòng tải lại trang.";
    if (cause.status === 409)
      return "Chủ sở hữu không thể rời công ty. Vui lòng kiểm tra lại vai trò của bạn.";
  }
  return "Chưa xác nhận được kết quả rời công ty. Vui lòng tải lại trang để kiểm tra trạng thái trước khi thử lại.";
}
