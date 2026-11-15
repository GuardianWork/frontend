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
export interface ScanView {
  scanId: number;
  revisionId: number;
  revisionVersion: number;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  mode: "stub" | "crawler";
  outdated: boolean;
  failureCode: string | null;
  report: ScanReport | null;
  analysisText: string;
  profile: string;
  legalSnapshot: string;
  asOfDate: string;
  createdAt: string;
}
export const scanProcessing = (scan: ScanView | null) =>
  scan?.status === "QUEUED" || scan?.status === "RUNNING";

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
async function readScan(
  path: string,
  revisionId: number,
  init?: RequestInit,
  expectedScanId?: number,
): Promise<ScanView> {
  const scan = (await authenticatedRequest(path, { cache: "no-store", ...init })) as ScanView;
  if (
    !scan ||
    scan.revisionId !== revisionId ||
    (expectedScanId !== undefined && scan.scanId !== expectedScanId) ||
    !Number.isSafeInteger(scan.scanId) ||
    scan.scanId <= 0 ||
    !Number.isSafeInteger(scan.revisionVersion) ||
    typeof scan.analysisText !== "string" ||
    !["QUEUED", "RUNNING", "COMPLETED", "FAILED"].includes(scan.status) ||
    !["stub", "crawler"].includes(scan.mode) ||
    typeof scan.outdated !== "boolean" ||
    (scan.status === "COMPLETED" &&
      (!scan.report ||
        scan.report.schemaVersion !== "1" ||
        !Array.isArray(scan.report.findings) ||
        !scan.report.findings.every(validFinding) ||
        typeof scan.report.asOfDate !== "string" ||
        !Array.isArray(scan.report.warnings) ||
        !scan.report.warnings.every((w) => typeof w === "string") ||
        !["POTENTIAL_RISKS", "NEEDS_REVIEW", "NO_RISKS_DETECTED", "OUT_OF_SCOPE"].includes(
          scan.report.outcome,
        )))
  ) {
    throw new ApiError("Phản hồi phân tích không hợp lệ.");
  }
  return scan;
}
const root = (jobId: number, revisionId: number) =>
  `/companies/me/jobs/${jobId}/revisions/${revisionId}/scans`;
export const requestJobScan = (
  jobId: number,
  revisionId: number,
  version: number,
  signal?: AbortSignal,
) =>
  readScan(root(jobId, revisionId), revisionId, {
    method: "POST",
    body: JSON.stringify({ expectedRevisionVersion: version }),
    signal,
  });
export const getJobScan = (
  jobId: number,
  revisionId: number,
  scanId: number,
  signal?: AbortSignal,
) => readScan(`${root(jobId, revisionId)}/${scanId}`, revisionId, { signal }, scanId);
export const getStaffJobScan = (revisionId: number, scanId: number, signal?: AbortSignal) =>
  readScan(`/staff/job-revisions/${revisionId}/scans/${scanId}`, revisionId, { signal }, scanId);
