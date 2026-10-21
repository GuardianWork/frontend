import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export type InvitationPreview = {
  invitationId: number;
  companyId: number;
  companyName: string;
  companyRole: "RECRUITER";
  expiresAt: string;
};
export type InvitationReceipt = Pick<
  InvitationPreview,
  "invitationId" | "companyId" | "companyName" | "companyRole"
> & {
  membershipId: number;
  membershipStatus: "ACTIVE" | "LEFT" | "REMOVED";
};
export type PersonalProof = {
  emailVerified: boolean;
  phoneVerified: boolean;
  phone: string | null;
  stage: string;
  companyRole: string | null;
};
const invitationKey = "guardianwork_invitation";
const emailKey = "guardianwork_member_email_proof";
const acceptanceKey = "guardianwork_invitation_acceptance";
const enrollmentKey = "guardianwork_invited_onboarding";

declare global {
  interface Window {
    guardianworkPrivateFragment?: string;
  }
}

/** Called only on Continue. The head bootstrap already removed the fragment before assets load. */
export function continuePrivateLink(kind: "invitation" | "email") {
  const raw = window.guardianworkPrivateFragment || window.location.hash;
  const params = new URLSearchParams(raw.replace(/^#/, ""));
  const value = params.get(kind === "invitation" ? "secret" : "memberEmailSecret");
  if (value && value.length > 128) {
    sessionStorage.removeItem(kind === "invitation" ? invitationKey : emailKey);
    delete window.guardianworkPrivateFragment;
    return null;
  }
  if (value) {
    sessionStorage.setItem(kind === "invitation" ? invitationKey : emailKey, value);
  }
  delete window.guardianworkPrivateFragment;
  if (window.location.hash) history.replaceState(null, "", location.pathname + location.search);
  return sessionStorage.getItem(kind === "invitation" ? invitationKey : emailKey);
}
export function hasPrivateEmailLink() {
  return (
    new URLSearchParams(
      (window.guardianworkPrivateFragment || window.location.hash).replace(/^#/, ""),
    ).has("memberEmailSecret") || Boolean(sessionStorage.getItem(emailKey))
  );
}
export function rememberAcceptance(userId: number, secret: string) {
  sessionStorage.setItem(acceptanceKey, JSON.stringify({ userId, secret }));
}
export function hasAcceptanceIntent(userId: number, secret: string) {
  try {
    const intent = JSON.parse(sessionStorage.getItem(acceptanceKey) || "null");
    return intent?.userId === userId && intent.secret === secret;
  } catch {
    return false;
  }
}
export function clearInvitation() {
  sessionStorage.removeItem(invitationKey);
  sessionStorage.removeItem(acceptanceKey);
}
export function clearEmailProof() {
  sessionStorage.removeItem(emailKey);
}
export function markInvitedOnboarding(userId: number) {
  sessionStorage.setItem(enrollmentKey, String(userId));
}
export function needsInvitedOnboarding(userId: number) {
  return sessionStorage.getItem(enrollmentKey) === String(userId);
}

export function onboardingError(
  error: unknown,
  context: "invitation" | "verification" = "verification",
) {
  if (!(error instanceof ApiError)) return "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
  if (error.status === 401)
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
  if (error.status === 404)
    return context === "invitation"
      ? "Lời mời không khả dụng. Kiểm tra tài khoản đang đăng nhập hoặc liên hệ người mời để nhận liên kết mới."
      : "Không thể tải trạng thái thành viên hiện tại. Hãy liên hệ chủ sở hữu công ty hoặc đăng nhập lại.";
  if (error.status === 409)
    return context === "invitation"
      ? "Thông tin hiện tại chưa cho phép tiếp tục. Nếu đang thuộc một công ty, bạn cần kết thúc tư cách thành viên trước khi tham gia công ty khác."
      : "Trạng thái hiện tại chưa cho phép xác thực. Kiểm tra lại thông tin và tải lại trạng thái.";
  if (error.status === 429) return "Vui lòng chờ ít nhất 60 giây trước khi yêu cầu gửi lại.";
  if (error.status === 503)
    return "Dịch vụ xác thực hiện chưa khả dụng. Chưa thể xác nhận dịch vụ đã tiếp nhận email. Vui lòng thử lại sau.";
  if (error.status === 400)
    return "Liên kết xác thực không hợp lệ hoặc đã hết hạn. Kiểm tra lại hoặc yêu cầu liên kết mới.";
  if (error.status === 403)
    return "Tài khoản chưa được phép thực hiện bước này. Tải lại trạng thái hoặc đăng nhập lại.";
  return "Không thể kết nối dịch vụ. Vui lòng thử lại; dữ liệu xác nhận chưa bị xoá.";
}
async function post(path: string, body: unknown) {
  return authenticatedRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
export async function previewInvitation(secret: string): Promise<InvitationPreview> {
  const data = (await post("/company-invitations/preview", { secret })) as InvitationPreview;
  if (
    !data ||
    typeof data.companyName !== "string" ||
    data.companyRole !== "RECRUITER" ||
    !Number.isSafeInteger(data.companyId) ||
    !Number.isSafeInteger(data.invitationId) ||
    !Number.isFinite(Date.parse(data.expiresAt))
  )
    throw new ApiError("Invalid preview");
  return data;
}
export async function acceptInvitation(secret: string): Promise<InvitationReceipt> {
  const data = (await post("/company-invitations/accept", {
    secret,
    confirm: true,
  })) as InvitationReceipt;
  if (
    !data ||
    !Number.isSafeInteger(data.companyId) ||
    data.companyRole !== "RECRUITER" ||
    !["ACTIVE", "LEFT", "REMOVED"].includes(data.membershipStatus)
  )
    throw new ApiError("Invalid receipt");
  return data;
}
export async function declineInvitation(secret: string) {
  await post("/company-invitations/decline", { secret });
}
export async function loadPersonalProof(): Promise<PersonalProof> {
  const data = (await authenticatedRequest("/me/employer-onboarding", {
    cache: "no-store",
  })) as PersonalProof;
  if (
    !data ||
    typeof data.emailVerified !== "boolean" ||
    typeof data.phoneVerified !== "boolean" ||
    typeof data.stage !== "string"
  )
    throw new ApiError("Invalid onboarding state");
  return data;
}
export async function sendMemberEmail() {
  const data = (await post("/me/employer-onboarding/email/send", {})) as {
    deliveryAccepted?: boolean;
  };
  if (data?.deliveryAccepted !== true) throw new ApiError("Delivery unavailable", 503);
}
export async function verifyMemberEmail(secret: string) {
  await post("/me/employer-onboarding/email/verify", { emailSecret: secret });
}
