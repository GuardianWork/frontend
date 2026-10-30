import { authenticatedRequest } from "./auth.ts";

export interface EmailVerificationRequest {
  deliveryAccepted: boolean;
  alreadyVerified: boolean;
  nextRequestAt: string | null;
  expiresAt: string | null;
}
export async function requestEmailVerification(): Promise<EmailVerificationRequest> {
  return (await authenticatedRequest("/me/email-verification/request", {
    method: "POST",
    cache: "no-store",
  })) as EmailVerificationRequest;
}
export async function confirmEmailVerification(emailSecret: string) {
  await authenticatedRequest("/me/email-verification/confirm", {
    method: "POST",
    body: JSON.stringify({ emailSecret }),
    cache: "no-store",
  });
}
