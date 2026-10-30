import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";
export interface InvitationPreview {
  invitationId: number;
  companyId: number;
  companyName: string;
  companyRole: "RECRUITER";
  expiresAt: string;
}
export async function previewInvitation(secret: string): Promise<InvitationPreview> {
  const result = (await authenticatedRequest("/company-invitations/preview", {
    method: "POST",
    body: JSON.stringify({ secret }),
  })) as InvitationPreview;
  if (
    !Number.isSafeInteger(result?.invitationId) ||
    !Number.isSafeInteger(result.companyId) ||
    typeof result.companyName !== "string" ||
    result.companyRole !== "RECRUITER" ||
    !Number.isFinite(Date.parse(result.expiresAt))
  )
    throw new ApiError("Không thể đọc lời mời. Hãy mở lại liên kết trong email.");
  return result;
}
export async function acceptInvitation(secret: string): Promise<void> {
  const result = (await authenticatedRequest("/company-invitations/accept", {
    method: "POST",
    body: JSON.stringify({ secret, confirm: true }),
  })) as { membershipId: number; companyRole: string; membershipStatus: string };
  if (
    !Number.isSafeInteger(result?.membershipId) ||
    result.companyRole !== "RECRUITER" ||
    result.membershipStatus !== "ACTIVE"
  )
    throw new ApiError(
      "Chưa xác nhận được kết quả nhận lời mời. Hãy tải lại tài khoản trước khi thử lại.",
    );
}
export function recipientInvitationError(cause: unknown) {
  if (cause instanceof ApiError) {
    if (cause.status === 403)
      return "Bạn chưa đủ điều kiện nhận lời mời. Hãy xác thực email và đăng nhập đúng tài khoản nhận lời mời.";
    if (cause.status === 409)
      return "Lời mời không còn phù hợp với trạng thái thành viên hiện tại. Hãy tải lại trạng thái tài khoản.";
    if ([400, 404, 410].includes(cause.status))
      return "Lời mời không hợp lệ, đã hết hạn hoặc không dành cho tài khoản này. Hãy mở liên kết mới nhất hoặc liên hệ chủ sở hữu công ty.";
  }
  return "Chưa xác nhận được kết quả xử lý lời mời. Hãy tải lại trạng thái trước khi thử lại.";
}
