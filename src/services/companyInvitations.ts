import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export interface OwnerInvitation {
  id: number;
  email: string;
  companyId: number;
  companyName: string;
  companyRole: "RECRUITER";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED";
  issuedAt: string;
  expiresAt: string;
  deliveryStatus: "UNKNOWN" | "PROVIDER_ACCEPTED" | "FAILED";
}
function parseInvitation(value: unknown): OwnerInvitation {
  const invitation = value as OwnerInvitation | null;
  if (
    !invitation ||
    !Number.isSafeInteger(invitation.id) ||
    !Number.isSafeInteger(invitation.companyId) ||
    typeof invitation.email !== "string" ||
    typeof invitation.companyName !== "string" ||
    invitation.companyRole !== "RECRUITER" ||
    !["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED"].includes(invitation.status) ||
    !["UNKNOWN", "PROVIDER_ACCEPTED", "FAILED"].includes(invitation.deliveryStatus) ||
    !Number.isFinite(Date.parse(invitation.issuedAt)) ||
    !Number.isFinite(Date.parse(invitation.expiresAt))
  ) {
    throw new ApiError(
      "Phản hồi lời mời không hợp lệ. Lời mời có thể đã được tạo; hãy kiểm tra trạng thái trước khi thử lại.",
    );
  }
  return invitation;
}
export async function issueCompanyInvitation(email: string): Promise<OwnerInvitation> {
  return parseInvitation(
    await authenticatedRequest("/companies/me/invitations", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      cache: "no-store",
    }),
  );
}
export async function resendCompanyInvitation(id: number): Promise<OwnerInvitation> {
  return parseInvitation(
    await authenticatedRequest(`/companies/me/invitations/${id}/resend`, {
      method: "POST",
      cache: "no-store",
    }),
  );
}
export function companyInvitationError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (cause.status === 403) return "Chỉ chủ sở hữu công ty đủ điều kiện mới được gửi lời mời.";
    if (cause.status === 409)
      return "Không thể tạo hoặc gửi lại lời mời ở trạng thái hiện tại. Có thể đã tồn tại lời mời đang chờ; hãy kiểm tra trước khi thử lại.";
    if (cause.status === 400)
      return "Email hoặc thông tin lời mời không hợp lệ. Vui lòng kiểm tra lại.";
  }
  return "Không thể xác nhận kết quả gửi lời mời. Lời mời có thể đã được lưu; hãy kiểm tra trạng thái trước khi thử lại.";
}

export interface RecipientInvitationPreview {
  invitationId: number;
  companyId: number;
  companyName: string;
  companyRole: "RECRUITER";
  expiresAt: string;
}
export async function previewCompanyInvitation(
  secret: string,
): Promise<RecipientInvitationPreview> {
  const result = (await authenticatedRequest("/company-invitations/preview", {
    method: "POST",
    body: JSON.stringify({ secret }),
    cache: "no-store",
  })) as RecipientInvitationPreview;
  if (
    !Number.isSafeInteger(result?.invitationId) ||
    !Number.isSafeInteger(result?.companyId) ||
    typeof result?.companyName !== "string" ||
    result?.companyRole !== "RECRUITER" ||
    !Number.isFinite(Date.parse(result?.expiresAt))
  )
    throw new ApiError("Không thể đọc thông tin lời mời. Vui lòng thử lại.");
  return result;
}
export async function acceptCompanyInvitation(secret: string) {
  return authenticatedRequest("/company-invitations/accept", {
    method: "POST",
    body: JSON.stringify({ secret, confirm: true }),
    cache: "no-store",
  });
}
export async function declineCompanyInvitation(secret: string) {
  return authenticatedRequest("/company-invitations/decline", {
    method: "POST",
    body: JSON.stringify({ secret }),
    cache: "no-store",
  });
}
