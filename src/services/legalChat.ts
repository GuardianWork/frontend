import { authenticatedRequest } from "./auth.ts";
import { ApiError } from "./api.ts";
export interface LegalChatCitation {
  nodeId: string;
  label: string;
  documentNumber: string;
  quote: string;
  quoteGrounded: boolean;
  effectiveStatus: string;
  applicability: "VERIFIED" | "UNVERIFIED";
}
export interface LegalChatReport {
  schemaVersion: "1";
  mode: "crawler";
  profile: string;
  legalSnapshot: string;
  asOfDate: string;
  model: string;
  status: "ANSWERED" | "INSUFFICIENT_CONTEXT";
  answer: string;
  citations: LegalChatCitation[];
  warnings: string[];
}
export async function askLegalQuestion(
  question: string,
  signal?: AbortSignal,
): Promise<LegalChatReport> {
  const report = (await authenticatedRequest("/candidates/me/legal-chat", {
    method: "POST",
    body: JSON.stringify({ question }),
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(670000)])
      : AbortSignal.timeout(670000),
  })) as LegalChatReport;
  if (
    !report ||
    report.schemaVersion !== "1" ||
    report.mode !== "crawler" ||
    ![report.profile, report.legalSnapshot, report.asOfDate, report.model, report.answer].every(
      (value) => typeof value === "string" && value.trim(),
    ) ||
    !["ANSWERED", "INSUFFICIENT_CONTEXT"].includes(report.status) ||
    !Array.isArray(report.warnings) ||
    !report.warnings.every((value) => typeof value === "string") ||
    !Array.isArray(report.citations) ||
    report.citations.length > 20 ||
    (report.status === "ANSWERED" && !report.citations.length) ||
    (report.status === "INSUFFICIENT_CONTEXT" && report.citations.length > 0) ||
    !report.citations.every(
      (citation) =>
        citation &&
        [citation.nodeId, citation.label, citation.documentNumber, citation.quote].every(
          (value) => typeof value === "string" && value.trim(),
        ) &&
        citation.quoteGrounded === true &&
        typeof citation.effectiveStatus === "string" &&
        ["VERIFIED", "UNVERIFIED"].includes(citation.applicability),
    )
  ) {
    throw new ApiError("Phản hồi trợ lý pháp lý không hợp lệ. Vui lòng thử lại.");
  }
  return report;
}
