import { authenticatedRequest } from "./auth.ts";
import { ApiError } from "./api.ts";

export interface ScanFinding {
  spanText: string;
  start: number;
  end: number;
  riskType: string;
  severity: "low" | "medium" | "high";
  verdict: "RISK" | "NEEDS_REVIEW";
  explanation: string;
  citations: {
    nodeId: string;
    label: string;
    documentNumber: string;
    quote: string;
    quoteGrounded: boolean;
    effectiveStatus: string;
    applicability: "VERIFIED" | "UNVERIFIED";
  }[];
}
export interface ScanReport {
  schemaVersion: "1";
  mode: "stub" | "crawler";
  profile: string;
  legalSnapshot: string;
  asOfDate: string;
  outcome: "POTENTIAL_RISKS" | "NEEDS_REVIEW" | "NO_RISKS_DETECTED" | "OUT_OF_SCOPE";
  findings: ScanFinding[];
  warnings: string[];
  usage: { available: boolean };
  model?: string;
}
/** Revision-bound response. Scan identifiers are intentionally discarded. */
export interface ScanView {
  revisionId: number;
  revisionVersion: number;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  mode: "stub" | "crawler";
  outdated: boolean;
  analysisText: string;
  report: ScanReport | null;
  asOfDate: string;
}
export type SharedScan = ScanView;
export const scanProcessing = (scan: ScanView | null) =>
  scan?.status === "QUEUED" || scan?.status === "RUNNING";
export const sharedScanProcessing = scanProcessing;

/** Loading analysis never validates or changes job content. */
export function scanReadError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Kiểm tra tham số yêu cầu phân tích và phiên bản JD.";
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403) return "Không thể truy cập JD này. Bạn không có quyền xem nội dung.";
    if (error.status === 404)
      return "Không thể truy cập JD này. Tin tuyển dụng không còn khả dụng.";
    if (error.status === 409)
      return "Phiên bản tin đã thay đổi. Hãy tải lại tin tuyển dụng để xem phân tích mới nhất.";
    if (error.status === 503)
      return "Dịch vụ phân tích AI hiện chưa khả dụng. Vui lòng thử lại sau.";
  }
  return "Không thể tải phân tích AI. Hãy tải lại tin tuyển dụng hoặc thử lại sau.";
}

function validFinding(f: ScanFinding) {
  return (
    f &&
    typeof f.spanText === "string" &&
    typeof f.explanation === "string" &&
    Number.isInteger(f.start) &&
    Number.isInteger(f.end) &&
    ["low", "medium", "high"].includes(f.severity) &&
    ["RISK", "NEEDS_REVIEW"].includes(f.verdict) &&
    Array.isArray(f.citations) &&
    f.citations.every(
      (c) =>
        c &&
        [c.nodeId, c.label, c.documentNumber, c.quote].every((v) => typeof v === "string") &&
        ["VERIFIED", "UNVERIFIED"].includes(c.applicability) &&
        typeof c.quoteGrounded === "boolean",
    )
  );
}
export function isScanReport(value: unknown): value is ScanReport {
  const report = value as ScanReport | null;
  return Boolean(
    report &&
    report.schemaVersion === "1" &&
    ["stub", "crawler"].includes(report.mode) &&
    Array.isArray(report.findings) &&
    report.findings.every(validFinding) &&
    typeof report.asOfDate === "string" &&
    Array.isArray(report.warnings) &&
    report.warnings.every((warning) => typeof warning === "string") &&
    ["POTENTIAL_RISKS", "NEEDS_REVIEW", "NO_RISKS_DETECTED", "OUT_OF_SCOPE"].includes(
      report.outcome,
    ),
  );
}
export async function requestSharedJobScan(
  jobId: number,
  revisionId: number,
  version: number,
  signal?: AbortSignal,
): Promise<ScanView> {
  const value = await authenticatedRequest(`/jobs/${jobId}/revisions/${revisionId}/scans`, {
    method: "POST",
    body: JSON.stringify({ expectedRevisionVersion: version }),
    cache: "no-store",
    signal,
  });
  const scan = value as ScanView | null;
  if (
    !scan ||
    scan.revisionId !== revisionId ||
    !Number.isSafeInteger(scan.revisionVersion) ||
    scan.revisionVersion < 0 ||
    !["QUEUED", "RUNNING", "COMPLETED", "FAILED"].includes(scan.status) ||
    !["stub", "crawler"].includes(scan.mode) ||
    typeof scan.outdated !== "boolean" ||
    (scan.analysisText !== null && typeof scan.analysisText !== "string") ||
    (scan.status === "COMPLETED" &&
      (typeof scan.analysisText !== "string" || !isScanReport(scan.report)))
  ) {
    throw new ApiError("Phản hồi phân tích không hợp lệ.");
  }
  return {
    revisionId: scan.revisionId,
    revisionVersion: scan.revisionVersion,
    status: scan.status,
    mode: scan.mode,
    outdated: scan.outdated,
    analysisText: scan.analysisText ?? "",
    report: scan.status === "COMPLETED" ? scan.report : null,
    asOfDate: typeof scan.asOfDate === "string" ? scan.asOfDate : "",
  };
}
export const requestJobScan = requestSharedJobScan;
