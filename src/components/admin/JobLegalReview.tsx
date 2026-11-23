import { useEffect, useState } from "react";
import {
  requestSharedJobScan,
  scanProcessing,
  scanReadError,
  type ScanView,
} from "@/services/jobScans";
import { ScanResult } from "@/components/recruiter/JobScanPanel";
import { ApiError } from "@/services/api";
import type { StaffJobReview } from "@/services/staffJobs";
import { LABOR_CODE_URL, reviewJobContent } from "@/lib/job-legal-review";
import { StaffStatusBadge } from "./StaffStatusBadge";
import { RotateCw } from "lucide-react";

export function JobLegalReview({
  review,
  onScan,
  onConflict,
}: {
  onConflict: () => Promise<unknown>;
  review: StaffJobReview;
  onScan?: (scan: ScanView | null) => void;
}) {
  return (
    <section className="staff-job-legal-review" aria-labelledby="job-legal-review-title">
      <RevisionScan
        key={`${review.id}:${review.revisionVersion}`}
        jobId={review.jobId}
        onConflict={onConflict}
        revisionId={review.id}
        revisionVersion={review.revisionVersion}
        onScan={onScan}
      />
    </section>
  );
}

export function PreliminaryJobReview({
  findings,
}: {
  findings: ReturnType<typeof reviewJobContent>;
}) {
  return (
    <details className="staff-preliminary-review" id="staff-preliminary-review">
      <summary>
        Kiểm tra sơ bộ nội dung{" "}
        <StaffStatusBadge tone={findings.length ? "pending" : "info"}>
          {findings.length
            ? `${findings.length} nhóm nội dung cần đối chiếu`
            : "Chưa khớp quy tắc kiểm tra"}
        </StaffStatusBadge>
      </summary>
      {findings.length ? (
        <ol className="staff-job-legal-findings">
          {findings.map((finding) => (
            <li key={finding.label}>
              <h4>{finding.label}</h4>
              <blockquote>{finding.excerpt}</blockquote>
              <a
                className="staff-legal-reference"
                href={LABOR_CODE_URL}
                target="_blank"
                rel="noreferrer"
              >
                {finding.legalReference} (mở tab mới)
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p>
          Không tìm thấy từ khóa thuộc các nhóm kiểm tra hiện có. Kết quả này không xác nhận tin phù
          hợp pháp luật.
        </p>
      )}
      <details className="staff-legal-method">
        <summary>Cách kiểm tra và giới hạn</summary>
        <p>
          Kiểm tra sơ bộ dùng quy tắc từ khóa trên nội dung của bản tin này, không phải kết quả AI.
        </p>
        <p>
          Đọc toàn bộ nội dung, ngữ cảnh và căn cứ pháp luật trước khi phê duyệt hoặc từ chối. Quy
          tắc có thể bỏ sót nội dung hoặc khớp cả câu phủ định.
        </p>
      </details>
    </details>
  );
}

function RevisionScan({
  jobId,
  revisionId,
  revisionVersion,
  onScan,
  onConflict,
}: {
  jobId: number;
  revisionId: number;
  revisionVersion: number;
  onScan?: (scan: ScanView | null) => void;
  onConflict: () => Promise<unknown>;
}) {
  const [scan, setScan] = useState<ScanView | null>(null);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    onScan?.(scan);
  }, [scan, onScan]);
  useEffect(() => {
    if (!requested) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      setBusy(true);
      try {
        const next = await requestSharedJobScan(jobId, revisionId, revisionVersion, abort.signal);
        if (abort.signal.aborted) return;
        setScan(next);
        if (scanProcessing(next)) timer = setTimeout(() => void poll(), 2000);
        else setBusy(false);
      } catch (cause) {
        if (abort.signal.aborted) return;
        setScan(null);
        setBusy(false);
        setError(scanReadError(cause));
        if (cause instanceof ApiError && cause.status === 409) {
          try {
            await onConflict();
          } catch {
            /* Retain the conflict guidance. */
          }
        }
      }
    };
    void poll();
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [jobId, revisionId, revisionVersion, requested, attempt, onConflict]);
  return (
    <div className="jp-page staff-known-scan">
      <h3 id="job-legal-review-title" className="sr-only" tabIndex={-1}>
        Phân tích AI
      </h3>
      {error && (
        <p className="jp-feedback jp-error" role="alert">
          {error}
        </p>
      )}
      {!scan && !busy && !error && (
        <p className="staff-scan-hint">
          Phân tích nội dung phiên bản đang xem để kiểm tra các điểm cần lưu ý.
        </p>
      )}
      {busy && !scan && (
        <p className="staff-scan-loading" role="status">
          Đang yêu cầu phân tích…
        </p>
      )}
      {scan?.status === "COMPLETED" ? (
        <details className="staff-ai-report">
          <summary>
            Xem báo cáo đầy đủ · {scan.report?.findings.length ?? 0} phát hiện
            {scan.mode === "stub" ? " · Stub: chưa phân tích AI" : ""}
            {scan.outdated ? " · Kết quả cần cập nhật" : ""}
          </summary>
          <ScanResult scan={scan} audience="staff" />
        </details>
      ) : (
        scan && <ScanResult scan={scan} audience="staff" />
      )}
      {scan?.status === "COMPLETED" && (
        <p className="staff-scan-footnote">
          Kết quả tham khảo không thay thế quyết định xét duyệt.
        </p>
      )}
      <button
        type="button"
        className="jp-button staff-scan-refresh"
        onClick={() => {
          setError("");
          setRequested(true);
          setAttempt((value) => value + 1);
        }}
        disabled={busy}
      >
        <RotateCw size={14} aria-hidden="true" />
        {busy
          ? "Đang phân tích…"
          : scan || error
            ? "Kiểm tra trạng thái phân tích"
            : "Phân tích JD bằng AI"}
      </button>
    </div>
  );
}
