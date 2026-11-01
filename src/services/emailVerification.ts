import { accountRequest, parseDelivery } from "./accountControl.ts";

export interface EmailVerificationRequest {
  deliveryAccepted: boolean;
  alreadyVerified: boolean;
  nextRequestAt?: string | null;
  expiresAt?: string | null;
}
export async function requestEmailVerification(): Promise<EmailVerificationRequest> {
  return parseDelivery(
    await accountRequest("/me/email-verification/request", {
      method: "POST",
      cache: "no-store",
    }),
  ) as EmailVerificationRequest;
}
export async function confirmEmailVerification(emailSecret: string) {
  await accountRequest("/me/email-verification/confirm", {
    method: "POST",
    body: JSON.stringify({ emailSecret }),
    cache: "no-store",
  });
}
