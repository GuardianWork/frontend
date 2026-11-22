import { useEffect, useState } from "react";
import {
  getLatestStaffJobScan,
  getStaffJobScan,
  scanProcessing,
  scanReadError,
  type ScanView,
} from "@/services/jobScans";
import { ScanResult } from "@/components/recruiter/JobScanPanel";
import type { StaffJobReview } from "@/services/staffJobs";
import { LABOR_CODE_URL, reviewJobContent } from "@/lib/job-legal-review";
import { StaffStatusBadge } from "./StaffStatusBadge";
import { RotateCw } from "lucide-react";

export function JobLegalReview({
  review,
  onScan,
}: {
  review: StaffJobReview;
  onScan?: (scan: ScanView | null) => void;
}) {
  return (
    <section className="staff-job-legal-review" aria-labelledby="job-legal-review-title">
      <RevisionScan
        key={`${review.id}:${review.revisionVersion}`}
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
  revisionId,
  revisionVersion,
  onScan,
}: {
  revisionId: number;
  revisionVersion: number;
  onScan?: (scan: ScanView | null) => void;
}) {
  const [scan, setScan] = useState<ScanView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setBusy(true);
    setError("");
    setScan(null);
    void getLatestStaffJobScan(revisionId, revisionVersion, abort.signal)
      .then((result) => {
        if (!abort.signal.aborted) setScan(result);
      })
      .catch((cause) => {
        if (!abort.signal.aborted) setError(scanReadError(cause));
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [revisionId, revisionVersion, reload]);
  useEffect(() => {
    onScan?.(scan);
  }, [scan, onScan]);
  useEffect(() => {
    if (!scan || !scanProcessing(scan) || error) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      void getStaffJobScan(revisionId, scan.scanId, abort.signal)
        .then((result) => {
          if (!abort.signal.aborted) setScan(result);
        })
        .catch((cause) => {
          if (!abort.signal.aborted) {
            setScan(null);
            setError(scanReadError(cause));
          }
        });
    }, 2000);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [revisionId, scan, error]);
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
        <p className="staff-scan-hint">Phiên bản này chưa có kết quả phân tích AI.</p>
      )}
      {busy && (
        <p className="staff-scan-loading" role="status">
          Đang tải phân tích của phiên bản này…
        </p>
      )}
      {scan?.status === "COMPLETED" && (
        <>
          {(scan.mode === "stub" || scan.report?.mode === "stub") && (
            <p className="jp-feedback jp-warning">
              Chế độ thử nghiệm — chưa thực hiện phân tích AI
            </p>
          )}
          {scan.outdated && (
            <p className="jp-feedback jp-warning">
              Kết quả thuộc phiên bản nội dung hoặc dữ liệu phân tích trước đó
            </p>
          )}
          <details className="staff-ai-report">
            <summary>Xem báo cáo đầy đủ · {scan.report?.findings.length ?? 0} phát hiện</summary>
            <ScanResult scan={scan} audience="staff" />
            <p className="staff-scan-footnote">
              Kết quả tham khảo không thay thế quyết định xét duyệt.
            </p>
          </details>
        </>
      )}
      {scan && scan.status !== "COMPLETED" && <ScanResult scan={scan} audience="staff" />}
      <button
        type="button"
        className="jp-button staff-scan-refresh"
        onClick={() => setReload((value) => value + 1)}
        disabled={busy}
      >
        <RotateCw size={14} aria-hidden="true" /> Tải lại phân tích
      </button>
    </div>
  );
}
