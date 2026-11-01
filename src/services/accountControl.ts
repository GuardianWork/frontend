import { ApiError, apiRequest } from "./api.ts";
import { clearAuthSession, getAccessToken } from "./auth.ts";

export type SelfServiceState = "ACTIVE" | "DEACTIVATED" | "DELETION_PENDING";
export type ClosureAction = "deactivation" | "deletion";
export type RecoveryAction = "REACTIVATE" | "CANCEL_DELETION";
export interface AccountIdentity {
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string | null;
  username: string;
  email: string;
  emailVerified: boolean;
  selfServiceState: SelfServiceState;
  closureEligible: boolean;
  closureBlockers: string[];
}
export interface CodeDelivery {
  deliveryAccepted: boolean;
  alreadyVerified?: boolean;
  nextRequestAt?: string | null;
  expiresAt?: string | null;
}
export interface IdentityInput {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

/** Account actions never replay a failed protected request or refresh after a 401. */
export async function accountRequest(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  try {
    return await apiRequest(path, {
      ...init,
      cache: "no-store",
      headers: {
        ...Object.fromEntries(new Headers(init.headers)),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAuthSession();
    throw error;
  }
}
export function parseAccount(value: unknown): AccountIdentity {
  const account = value as AccountIdentity;
  if (
    !account ||
    typeof account.firstName !== "string" ||
    typeof account.lastName !== "string" ||
    typeof account.fullName !== "string" ||
    typeof account.username !== "string" ||
    typeof account.email !== "string" ||
    typeof account.emailVerified !== "boolean" ||
    typeof account.closureEligible !== "boolean" ||
    !Array.isArray(account.closureBlockers) ||
    !account.closureBlockers.every((x) => typeof x === "string") ||
    !["ACTIVE", "DEACTIVATED", "DELETION_PENDING"].includes(account.selfServiceState)
  )
    throw new ApiError("Phản hồi tài khoản không hợp lệ.");
  return { ...account, phoneNumber: account.phoneNumber ?? null };
}
export function parseDelivery(value: unknown): CodeDelivery {
  const delivery = value as CodeDelivery;
  if (!delivery || typeof delivery.deliveryAccepted !== "boolean")
    throw new ApiError("Phản hồi gửi mã không hợp lệ.");
  return delivery;
}
export async function loadAccount() {
  return parseAccount(await accountRequest("/me/account"));
}
export async function updateAccount(input: IdentityInput) {
  return parseAccount(
    await accountRequest("/me/account", {
      method: "PUT",
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber === null ? null : input.phoneNumber.trim(),
      }),
    }),
  );
}
export function validNewPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}
export async function changePassword(currentPassword: string, newPassword: string) {
  await accountRequest("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  clearAuthSession();
}
export async function requestClosureCode(action: ClosureAction, currentPassword: string) {
  return parseDelivery(
    await accountRequest(`/me/account/${action}/request-code`, {
      method: "POST",
      body: JSON.stringify({ currentPassword }),
    }),
  );
}
async function lifecycleResult(promise: Promise<unknown>, expected: SelfServiceState) {
  const result = (await promise) as { selfServiceState?: string };
  if (result?.selfServiceState !== expected)
    throw new ApiError("Chưa xác nhận được trạng thái tài khoản.");
  return result;
}
export async function confirmClosure(
  action: ClosureAction,
  currentPassword: string,
  emailSecret: string,
  acknowledgeConsequences: boolean,
) {
  const result = await lifecycleResult(
    accountRequest(`/me/account/${action}/confirm`, {
      method: "POST",
      body: JSON.stringify({ currentPassword, emailSecret, acknowledgeConsequences }),
    }),
    action === "deactivation" ? "DEACTIVATED" : "DELETION_PENDING",
  );
  clearAuthSession();
  return result;
}
export interface RecoveryInput {
  usernameOrEmail: string;
  password: string;
  action: RecoveryAction;
}
/** Deliberately unauthenticated: never attach or restore a stored Bearer token. */
export async function requestRecoveryCode(input: RecoveryInput) {
  return parseDelivery(
    await apiRequest("/auth/account-recovery/request-code", {
      method: "POST",
      body: JSON.stringify({
        usernameOrEmail: input.usernameOrEmail.trim(),
        password: input.password,
        action: input.action,
      }),
    }),
  );
}
export async function confirmRecovery(
  input: RecoveryInput,
  emailSecret: string,
  acknowledgeConsequences: boolean,
) {
  return lifecycleResult(
    apiRequest("/auth/account-recovery/confirm", {
      method: "POST",
      body: JSON.stringify({
        usernameOrEmail: input.usernameOrEmail.trim(),
        password: input.password,
        action: input.action,
        emailSecret,
        acknowledgeConsequences,
      }),
    }),
    "ACTIVE",
  );
}
export function accountError(
  error: unknown,
  context:
    | "identity"
    | "password"
    | "verification"
    | "deactivation"
    | "deletion"
    | "recovery" = "identity",
) {
  if (!(error instanceof ApiError)) return "Chưa thể hoàn tất yêu cầu. Vui lòng thử lại.";
  const code = /^\d{5}/.exec(error.message)?.[0];
  const messages: Record<string, string> = {
    "40002": "Mật khẩu mới cần 8–128 ký tự, có chữ hoa, chữ thường và chữ số.",
    "40030":
      "Mã xác minh email không hợp lệ, đã hết hạn hoặc đã hết lượt thử. Hãy dùng mã mới nhất hoặc gửi lại mã.",
    "40094": `Mã ${context === "deactivation" ? "tạm ngừng" : context === "deletion" ? "yêu cầu xóa" : "khôi phục"} không hợp lệ, đã hết hạn hoặc đã hết lượt thử. Hãy dùng mã mới nhất hoặc gửi lại mã.`,
    "40300": "Tính năng này chỉ dành cho tài khoản người dùng tại cổng công khai.",
    "40304":
      "Tài khoản hiện không thể thực hiện thao tác này. Khôi phục chỉ áp dụng khi tài khoản đủ điều kiện; tài khoản bị cấm không thể khôi phục.",
    "40335": "Hãy xác minh email đã đăng ký trước khi tiếp tục.",
    "40930": "Số điện thoại không khả dụng. Hãy dùng số khác.",
    "40994":
      "Bạn đang sở hữu công ty nên chưa thể đóng tài khoản. Hiện chưa có quy trình chuyển quyền sở hữu hoặc đóng công ty.",
    "40910":
      "Bạn còn là thành viên công ty nên chưa thể đóng tài khoản. Kiểm tra vai trò và hướng dẫn bên dưới.",
    "40995":
      "Thao tác không còn phù hợp với trạng thái hiện tại. Hãy tải lại trạng thái trước khi tiếp tục.",
    "42994": "Bạn vừa yêu cầu mã. Hãy chờ hết thời gian trước khi gửi lại.",
    "42930": "Bạn vừa yêu cầu mã xác minh. Hãy chờ hết thời gian trước khi gửi lại.",
  };
  if (code && messages[code]) return messages[code];
  if (error.status === 401)
    return context === "recovery"
      ? "Email, tên đăng nhập hoặc mật khẩu không chính xác."
      : "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.";
  if (error.status === 400)
    return context === "identity"
      ? "Kiểm tra họ, tên và số điện thoại Việt Nam rồi thử lại."
      : "Kiểm tra thông tin, mật khẩu hiện tại và xác nhận hậu quả trước khi tiếp tục.";
  if (error.status === 403) return "Tài khoản không có quyền thực hiện thao tác này.";
  if (error.status === 409)
    return "Thông tin hoặc trạng thái tài khoản đã thay đổi. Hãy tải lại để kiểm tra.";
  if (error.status === 429) return "Hãy chờ hết thời gian trước khi gửi lại mã.";
  return "Chưa xác nhận được kết quả. Hãy tải lại trạng thái trước khi thử lại; không gửi xác nhận liên tiếp.";
}
export function isoTime(value?: string | null) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
export function formatAccountTime(value?: string | null) {
  return isoTime(value)
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value!))
    : "";
}
