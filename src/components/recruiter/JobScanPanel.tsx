import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileSearch } from "lucide-react";
import { ApiError } from "@/services/api";
import {
  requestJobScan,
  scanProcessing,
  scanReadError,
  type ScanView,
  type ScanFinding,
} from "@/services/jobScans";
import type { Job, JobRevision } from "@/services/jobs";
import { scanOutcomeLabels, scanSeverityLabels } from "@/lib/job-content";
import "./job-scan.css";

const states = {
  QUEUED: "Đang chờ phân tích",
  RUNNING: "Đang phân tích nội dung",
  COMPLETED: "Đã hoàn tất phân tích",
  FAILED: "Không thể hoàn tất phân tích",
};

export function ScanFindingEvidence({
  finding,
  showExcerpt = true,
  showExplanation = true,
}: {
  finding: ScanFinding;
  showExcerpt?: boolean;
  showExplanation?: boolean;
}) {
  return (
    <>
      {finding.verdict === "NEEDS_REVIEW" && <p className="jp-scan-review">Cần kiểm tra thêm</p>}
      {showExcerpt && <blockquote>{finding.spanText}</blockquote>}
      {showExplanation && <p>{finding.explanation}</p>}
      {finding.citations.map((citation, index) => (
        <details className="jp-scan-citation" key={`${citation.nodeId}:${index}`}>
          <summary>
            {citation.documentNumber} · {citation.label}
          </summary>
          {citation.applicability === "UNVERIFIED" && (
            <p className="jp-scan-review">Cần xác minh hiệu lực điều khoản</p>
          )}
          {!citation.quoteGrounded && (
            <p className="jp-scan-review">Trích dẫn cần được đối chiếu với văn bản gốc.</p>
          )}
          <blockquote>{citation.quote}</blockquote>
        </details>
      ))}
    </>
  );
}

// Split by code point (not UTF-16 offsets). Boundaries also support overlapping findings.
function Snapshot({ scan }: { scan: ScanView }) {
  const characters = Array.from(scan.analysisText);
  const ranges = (scan.report?.findings ?? []).filter(
    (f) =>
      Number.isInteger(f.start) &&
      Number.isInteger(f.end) &&
      f.start >= 0 &&
      f.end > f.start &&
      f.end <= characters.length,
  );
  const boundaries = [
    ...new Set([0, characters.length, ...ranges.flatMap((f) => [f.start, f.end])]),
  ].sort((a, b) => a - b);
  return (
    <div className="jp-scan-snapshot">
      {boundaries.slice(0, -1).map((start, index) => {
        const text = characters.slice(start, boundaries[index + 1]).join("");
        return ranges.some((f) => f.start <= start && f.end > start) ? (
          <mark key={start}>{text}</mark>
        ) : (
          <span key={start}>{text}</span>
        );
      })}
    </div>
  );
}

export function ScanResult({
  scan,
  outdated = false,
  audience = "recruiter",
}: {
  scan: ScanView;
  outdated?: boolean;
  audience?: "recruiter" | "staff";
}) {
  const report = scan.status === "COMPLETED" ? scan.report : null;
  return (
    <div className="jp-scan-result">
      {(scan.mode === "stub" || report?.mode === "stub") && (
        <p className="jp-feedback jp-warning">
          <strong>Chế độ thử nghiệm — chưa thực hiện phân tích AI</strong>
        </p>
      )}
      {(scan.outdated || outdated) && (
        <p className="jp-feedback jp-warning">
          Kết quả thuộc phiên bản nội dung hoặc dữ liệu phân tích trước đó
        </p>
      )}
      <div role="status" className="jp-scan-status">
        <strong>{report ? scanOutcomeLabels[report.outcome] : states[scan.status]}</strong>
        {report && <span>{report.findings.length} phát hiện</span>}
      </div>
      {scanProcessing(scan) && (
        <p>
          {audience === "staff"
            ? "Kết quả sẽ tự cập nhật. Bạn có thể tiếp tục đọc nội dung trong khi chờ."
            : "Bạn có thể tiếp tục chỉnh sửa hoặc gửi duyệt trong khi chờ kết quả."}
        </p>
      )}
      {scan.status === "FAILED" && (
        <p>
          {audience === "staff"
            ? "Chưa thể phân tích nội dung này. Yêu cầu lại cùng phiên bản sẽ trả về trạng thái thất bại này. Đối chiếu nội dung và căn cứ trước khi xét duyệt."
            : "Chưa thể phân tích nội dung này. Bạn vẫn có thể lưu và gửi duyệt bình thường. Yêu cầu lại cùng phiên bản sẽ trả về kết quả này."}
        </p>
      )}
      {report && (
        <>
          <p className="jp-scan-date">
            Ngày phân tích: {report.asOfDate.split("-").reverse().join("/")}
          </p>
          {report.findings.map((finding, index) => (
            <article className="jp-scan-finding" key={index}>
              <div className="jp-scan-finding-heading">
                <h4>Phát hiện {index + 1}</h4>
                <span className={`jp-scan-severity jp-scan-severity-${finding.severity}`}>
                  Mức độ: {scanSeverityLabels[finding.severity]}
                </span>
              </div>
              <ScanFindingEvidence finding={finding} />
            </article>
          ))}
          {report.warnings.length > 0 && (
            <div className="jp-scan-warnings">
              <h4>Lưu ý của báo cáo</h4>
              <ul>
                {report.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {scan.status === "COMPLETED" && (
        <details className="jp-scan-disclosure">
          <summary>Xem bản nội dung đã phân tích</summary>
          <p>
            Đánh dấu chỉ áp dụng cho bản lưu bên dưới, bao gồm nhãn trường và nội dung đã gửi phân
            tích.
          </p>
          <Snapshot scan={scan} />
        </details>
      )}
    </div>
  );
}

export function JobScanPanel({
  job,
  revision,
  busy,
  editable,
  localEdits,
  editSequence,
  recover,
  onResult,
  compact = false,
  editorMode = false,
  editorTarget,
  autoReady = false,
}: {
  job: Job | null;
  revision?: JobRevision | null;
  busy: boolean;
  editable: boolean;
  localEdits: boolean;
  editSequence: number;
  recover: (jobId: number, signal: AbortSignal) => Promise<Job>;
  onResult?: (scan: ScanView | null, outdated: boolean, viewedVersion?: number) => void;
  compact?: boolean;
  editorMode?: boolean;
  editorTarget?: HTMLElement | null;
  autoReady?: boolean;
}) {
  const [scan, setScan] = useState<ScanView | null>(null);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [analyzedSequence, setAnalyzedSequence] = useState(-1);
  const [resultRevisionVersion, setResultRevisionVersion] = useState<number | undefined>();
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const viewedRevision = revision ?? job?.workingRevision;
  const jobId = job?.id;
  const revisionId = viewedRevision?.id;
  const revisionVersion = viewedRevision?.version;
  const scope = `${jobId}:${revisionId}:${revisionVersion}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const resultEpoch = useRef(0);
  const sequence = useRef(editSequence);
  sequence.current = editSequence;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    resultEpoch.current++;
    controller.current?.abort();
    setScan(null);
    setError("");
    setRequesting(false);
    setResultRevisionVersion(undefined);
  }, [scope]);
  const handleFailure = async (cause: unknown, id: number, signal: AbortSignal) => {
    setScan(null);
    setError(scanReadError(cause));
    if (cause instanceof ApiError && cause.status === 409) {
      // Reload the JD/version, but require an explicit new analysis request.
      await recover(id, signal);
    }
  };
  const failureRef = useRef(handleFailure);
  failureRef.current = handleFailure;
  useEffect(() => {
    if (!scanProcessing(scan) || !scan || !jobId || revisionVersion === undefined || error) return;
    const abort = new AbortController();
    const capturedScope = scope;
    const timer = setTimeout(() => {
      void requestJobScan(jobId, revisionId!, revisionVersion, abort.signal)
        .then((next) => {
          if (!abort.signal.aborted && currentScope.current === capturedScope) setScan(next);
        })
        .catch(async (cause) => {
          if (!abort.signal.aborted && currentScope.current === capturedScope) {
            try {
              await failureRef.current(cause, jobId, abort.signal);
            } catch {
              /* Keep the actionable conflict message if JD reload fails. */
            }
          }
        });
    }, 2000);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [scan, jobId, revisionId, revisionVersion, error, scope]);
  const start = async () => {
    if (requesting || busy || localEdits || !revisionId) return;
    const epoch = ++resultEpoch.current;
    const capturedScope = scope;
    setRequesting(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    const atSequence = sequence.current;
    try {
      // Analyze the saved revision currently displayed, never a different working revision.
      if (!jobId || !revisionId || revisionVersion === undefined) {
        throw new ApiError("Missing revision", 400);
      }
      const result = await requestJobScan(jobId, revisionId, revisionVersion, abort.signal);
      if (
        mounted.current &&
        !abort.signal.aborted &&
        currentScope.current === capturedScope &&
        epoch === resultEpoch.current
      ) {
        setScan(result);
        setAnalyzedSequence(atSequence);
        setResultRevisionVersion(revisionVersion);
      }
    } catch (cause) {
      if (
        mounted.current &&
        !abort.signal.aborted &&
        currentScope.current === capturedScope &&
        epoch === resultEpoch.current
      ) {
        try {
          await handleFailure(cause, jobId!, abort.signal);
        } catch {
          /* The original failure remains visible. */
        }
      }
    } finally {
      if (mounted.current && !abort.signal.aborted && epoch === resultEpoch.current)
        setRequesting(false);
    }
  };
  const processing = scanProcessing(scan);
  const outdated =
    editSequence !== analyzedSequence ||
    localEdits ||
    Boolean(scan?.outdated) ||
    resultRevisionVersion !== revisionVersion;
  useEffect(() => {
    onResult?.(scan, outdated, resultRevisionVersion);
  }, [scan, outdated, onResult, resultRevisionVersion]);
  if (editorMode) {
    const message =
      error ||
      (requesting
        ? "Đang yêu cầu phân tích…"
        : processing
          ? "AI đang phân tích nội dung…"
          : localEdits
            ? "Lưu thay đổi trước khi phân tích phiên bản này."
            : !revisionId
              ? "Lưu bản nháp trước khi phân tích."
              : !autoReady
                ? "Nhập mô tả công việc để AI kiểm tra."
                : outdated || !scan
                  ? "Phân tích phiên bản đã lưu khi bạn sẵn sàng."
                  : scan.status === "FAILED"
                    ? "Chưa thể phân tích nội dung. Bạn vẫn có thể tiếp tục soạn tin."
                    : scan.mode === "stub" || scan.report?.mode === "stub"
                      ? "Chế độ thử nghiệm — chưa thực hiện phân tích AI"
                      : `${scan.report?.findings.length ?? 0} phát hiện · Di chuột hoặc dùng Tab đến phần đánh dấu để xem.`);
    return editorTarget
      ? createPortal(
          <>
            <div className="jp-editor-analysis-status" role={error ? "alert" : "status"}>
              <span>{message}</span>
              {editable && (
                <button
                  type="button"
                  disabled={
                    busy || requesting || processing || localEdits || !autoReady || !revisionId
                  }
                  onClick={() => void start()}
                >
                  {requesting || processing
                    ? "Đang phân tích…"
                    : error || scan?.status === "FAILED"
                      ? "Kiểm tra trạng thái"
                      : "Kiểm tra nội dung với AI"}
                </button>
              )}
            </div>
            {scan?.status === "COMPLETED" ? (
              <details className="jp-scan-full-report">
                <summary>
                  Xem báo cáo phân tích · {scan.report?.findings.length ?? 0} phát hiện
                  {scan.mode === "stub" || scan.report?.mode === "stub"
                    ? " · Stub: chưa phân tích AI"
                    : ""}
                  {outdated ? " · Kết quả cần cập nhật" : ""}
                </summary>
                <ScanResult scan={scan} outdated={outdated} />
              </details>
            ) : (
              scan && <ScanResult scan={scan} outdated={outdated} />
            )}
          </>,
          editorTarget,
        )
      : null;
  }
  return (
    <section
      className={`jp-scan${compact ? " jp-scan--compact" : ""}`}
      aria-labelledby={compact ? undefined : "job-scan-heading"}
      aria-label={compact ? "Phân tích nội dung JD" : undefined}
    >
      <div className="jp-scan-heading">
        {!compact && (
          <div>
            <h3 id="job-scan-heading">
              <FileSearch size={20} aria-hidden="true" />
              Phân tích JD bằng AI
            </h3>
          </div>
        )}
        {viewedRevision && (
          <button
            type="button"
            className="jp-button"
            disabled={busy || requesting || processing || localEdits || !revisionId}
            onClick={() => void start()}
          >
            {requesting
              ? "Đang yêu cầu phân tích…"
              : processing
                ? "Đang phân tích…"
                : scan?.status === "FAILED"
                  ? "Kiểm tra trạng thái phân tích"
                  : "Kiểm tra nội dung với AI"}
          </button>
        )}
      </div>
      {!compact && (
        <p className="jp-scan-revision">
          {viewedRevision
            ? `Bản v${viewedRevision.revisionNumber} · Nội dung đang xem`
            : "Bản nháp chưa lưu"}
        </p>
      )}
      {!compact && editable && !scan && !error && (
        <p className="jp-scan-hint">
          Lưu thay đổi trước khi phân tích. Kết quả chỉ áp dụng cho phiên bản đã lưu.
        </p>
      )}
      {error && (
        <p className="jp-feedback jp-error" role="alert">
          {error}
        </p>
      )}
      {scan?.status === "COMPLETED" ? (
        <details className="jp-scan-full-report">
          <summary>
            Xem báo cáo phân tích · {scan.report?.findings.length ?? 0} phát hiện
            {scan.mode === "stub" || scan.report?.mode === "stub"
              ? " · Stub: chưa phân tích AI"
              : ""}
            {outdated ? " · Kết quả cần cập nhật" : ""}
          </summary>
          <ScanResult scan={scan} outdated={outdated} />
        </details>
      ) : (
        scan && <ScanResult scan={scan} outdated={outdated} />
      )}
    </section>
  );
}
