/** Shared outcome labels for dossiers and historical company-verification events.
 * CHECKED is a processing state, not an approval outcome, and deliberately has no mapping. */
export const COMPANY_VERIFICATION_LABELS = {
  REGISTERED: "Chưa gửi",
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã xác minh",
  REJECTED: "Đã từ chối",
} as const;
export const COMPANY_VERIFICATION_TONES = {
  REGISTERED: "neutral",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;
export function companyVerificationPresentation(value: string) {
  if (!Object.hasOwn(COMPANY_VERIFICATION_LABELS, value))
    return { label: "Chưa rõ kết quả xác minh", tone: "neutral" as const };
  const status = value as keyof typeof COMPANY_VERIFICATION_LABELS;
  return { label: COMPANY_VERIFICATION_LABELS[status], tone: COMPANY_VERIFICATION_TONES[status] };
}
