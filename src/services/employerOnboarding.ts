import { ApiError, apiRequest } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export type EmployerStage =
  "EMAIL_REQUIRED" | "COMPANY_ACTION_REQUIRED" | "PENDING" | "REJECTED" | "VERIFIED";
export interface EmployerOnboarding {
  stage: EmployerStage;
  fullName?: string;
  phone?: string | null;
  companyName?: string;
  workAddress?: string;
}
export interface EmployerRegistrationInput {
  fullName: string;
  phone: string;
  companyName: string;
  gender: string;
  workAddress: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}
export interface EmployerRegistrationResult {
  userId: number;
  emailVerified: false;
  stage: "EMAIL_REQUIRED";
  deliveryAccepted: boolean;
}
export async function registerEmployer(
  input: EmployerRegistrationInput,
): Promise<EmployerRegistrationResult> {
  const result = (await apiRequest("/employer-registrations", {
    method: "POST",
    body: JSON.stringify({
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      companyName: input.companyName.trim(),
      gender: input.gender,
      workAddress: input.workAddress.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      passwordConfirmation: input.passwordConfirmation,
    }),
  })) as EmployerRegistrationResult;
  if (
    !Number.isSafeInteger(result?.userId) ||
    result.emailVerified !== false ||
    result.stage !== "EMAIL_REQUIRED" ||
    typeof result.deliveryAccepted !== "boolean"
  )
    throw new ApiError(
      "Chưa xác nhận được kết quả tạo tài khoản. Hãy thử đăng nhập trước khi đăng ký lại.",
    );
  return result;
}
export async function loadEmployerOnboarding(): Promise<EmployerOnboarding> {
  const result = (await authenticatedRequest("/me/employer-onboarding", {
    cache: "no-store",
  })) as EmployerOnboarding;
  if (
    !["EMAIL_REQUIRED", "COMPANY_ACTION_REQUIRED", "PENDING", "REJECTED", "VERIFIED"].includes(
      result?.stage,
    )
  )
    throw new ApiError("Không thể đọc trạng thái tuyển dụng. Vui lòng tải lại.");
  return result;
}
export async function sendEmployerEmail(): Promise<{ deliveryAccepted: boolean }> {
  const result = (await authenticatedRequest("/me/employer-onboarding/email/send", {
    method: "POST",
  })) as { deliveryAccepted: boolean };
  if (typeof result?.deliveryAccepted !== "boolean")
    throw new ApiError(
      "Chưa xác nhận được kết quả gửi email. Hãy kiểm tra hộp thư trước khi gửi lại.",
    );
  return result;
}
export async function verifyEmployerEmail(emailSecret: string): Promise<void> {
  await authenticatedRequest("/me/employer-onboarding/email/verify", {
    method: "POST",
    body: JSON.stringify({ emailSecret }),
  });
}
export function employerError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 409)
      return "Email hoặc số điện thoại đã được sử dụng. Hãy đăng nhập nếu bạn đã có tài khoản.";
    if (cause.status === 429) return "Bạn gửi yêu cầu quá sớm. Vui lòng chờ 60 giây rồi thử lại.";
    if (cause.status === 400)
      return "Liên kết xác thực không hợp lệ hoặc đã hết hạn. Hãy dùng email mới nhất hoặc gửi lại email xác thực.";
    if (cause.status === 403)
      return "Tài khoản chưa đủ điều kiện thực hiện thao tác này. Hãy đăng nhập đúng tài khoản nhận email và kiểm tra trạng thái xác thực.";
  }
  // Never echo a verification response that could contain the secret.
  return "Không thể hoàn tất yêu cầu. Vui lòng kiểm tra kết nối và thử lại.";
}
