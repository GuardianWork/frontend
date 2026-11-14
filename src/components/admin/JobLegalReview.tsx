import { useEffect, useRef, useState } from "react";
import { getStaffJobScan, scanProcessing, type ScanView } from "@/services/jobScans";
import { jobError } from "@/services/jobs";
import { ScanResult } from "@/components/recruiter/JobScanPanel";
import type { StaffJobReview } from "@/services/staffJobs";
import { LABOR_CODE_URL, reviewJobContent } from "@/lib/job-legal-review";
import { StaffStatusBadge } from "./StaffStatusBadge";

export function JobLegalReview({
  review,
  findings,
}: {
  review: StaffJobReview;
  findings: ReturnType<typeof reviewJobContent>;
}) {
  return (
    <section
      className="admin-panel staff-job-legal-review"
      aria-labelledby="job-legal-review-title"
    >
      <div className="admin-panel-heading">
        <div>
          <h2 id="job-legal-review-title">Rà soát AI theo pháp luật</h2>
          <p>
            Tin #{review.jobId} · Bản v{review.revisionNumber} · Phiên bản dữ liệu{" "}
            {review.revisionVersion}
          </p>
        </div>
      </div>
      <div className="staff-job-legal-body">
        <KnownScan key={`${review.id}:${review.revisionVersion}`} revisionId={review.id} />
        <h3>Kiểm tra sơ bộ nội dung</h3>
        <StaffStatusBadge tone={findings.length ? "pending" : "info"}>
          {findings.length
            ? `${findings.length} nhóm nội dung cần đối chiếu`
            : "Chưa khớp quy tắc kiểm tra"}
        </StaffStatusBadge>
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
            Không tìm thấy từ khóa thuộc các nhóm kiểm tra hiện có. Kết quả này không xác nhận tin
            phù hợp pháp luật.
          </p>
        )}
        <details className="staff-legal-method">
          <summary>Cách kiểm tra và giới hạn</summary>
          <p>
            Kiểm tra sơ bộ dùng quy tắc từ khóa trên nội dung của bản tin này, không phải kết quả
            AI.
          </p>
          <p>
            Đọc toàn bộ nội dung, ngữ cảnh và căn cứ pháp luật trước khi phê duyệt hoặc từ chối. Quy
            tắc có thể bỏ sót nội dung hoặc khớp cả câu phủ định.
          </p>
        </details>
      </div>
    </section>
  );
}

function KnownScan({ revisionId }: { revisionId: number }) {
  const [scanId, setScanId] = useState("");
  const [scan, setScan] = useState<ScanView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
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
            setError(jobError(cause));
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
      {!scan && !busy && <StaffStatusBadge tone="neutral">Chưa có kết quả AI</StaffStatusBadge>}
      <p>
        Chưa hỗ trợ tự động tìm kết quả AI. Nhập mã phân tích đã biết để xem kết quả của phiên bản
        này.
      </p>
      <form
        className="staff-known-scan-form"
        onSubmit={(event) => {
          event.preventDefault();
          const id = Number(scanId);
          if (!Number.isSafeInteger(id) || id <= 0) {
            setError("Vui lòng nhập mã phân tích hợp lệ.");
            return;
          }
          request.current?.abort();
          const abort = new AbortController();
          request.current = abort;
          setBusy(true);
          setError("");
          setScan(null);
          void getStaffJobScan(revisionId, id, abort.signal)
            .then((result) => {
              if (!abort.signal.aborted) setScan(result);
            })
            .catch((cause) => {
              if (!abort.signal.aborted) setError(jobError(cause));
            })
            .finally(() => {
              if (!abort.signal.aborted) setBusy(false);
            });
        }}
      >
        <label htmlFor="staff-known-scan-id">Mã phân tích</label>
        <input
          id="staff-known-scan-id"
          type="text"
          inputMode="numeric"
          value={scanId}
          onChange={(event) => setScanId(event.target.value)}
          required
        />
        <button type="submit" className="jp-button" disabled={busy}>
          {busy ? "Đang tải…" : "Xem kết quả AI"}
        </button>
      </form>
      {error && (
        <p className="jp-feedback jp-error" role="alert">
          {error}
        </p>
      )}
      {scan && <ScanResult scan={scan} />}
      <p>
        Chỉ xem được kết quả thuộc nội dung được phép truy cập. Kết quả tham khảo không thay thế
        quyết định xét duyệt.
      </p>
    </div>
  );
}
