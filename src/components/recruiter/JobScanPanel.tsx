import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileSearch } from "lucide-react";
import { ApiError } from "@/services/api";
import {
  getJobScan,
  requestJobScan,
  scanProcessing,
  type ScanView,
  type ScanFinding,
} from "@/services/jobScans";
import { jobError, type Job } from "@/services/jobs";
import "./job-scan.css";

const outcomes = {
  POTENTIAL_RISKS: "Phát hiện dấu hiệu rủi ro",
  NEEDS_REVIEW: "Cần kiểm tra thêm",
  NO_RISKS_DETECTED: "Chưa phát hiện rủi ro trong phạm vi kiểm tra",
  OUT_OF_SCOPE: "Ngoài phạm vi hỗ trợ",
};
const states = {
  QUEUED: "Đang chờ phân tích",
  RUNNING: "Đang phân tích nội dung",
  COMPLETED: "Đã hoàn tất phân tích",
  FAILED: "Không thể hoàn tất phân tích",
};
const severityLabels = { low: "Thấp", medium: "Trung bình", high: "Cao" };

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

export function ScanResult({ scan, outdated = false }: { scan: ScanView; outdated?: boolean }) {
  const report = scan.status === "COMPLETED" ? scan.report : null;
  return (
    <div className="jp-scan-result">
      <p className="jp-scan-date">Mã phân tích #{scan.scanId}</p>
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
        <strong>{report ? outcomes[report.outcome] : states[scan.status]}</strong>
        {report && <span>{report.findings.length} phát hiện</span>}
      </div>
      {scanProcessing(scan) && (
        <p>Bạn có thể tiếp tục chỉnh sửa hoặc gửi duyệt trong khi chờ kết quả.</p>
      )}
      {scan.status === "FAILED" && (
        <p>
          Chưa thể phân tích nội dung này. Bạn vẫn có thể lưu và gửi duyệt bình thường. Yêu cầu lại
          cùng phiên bản sẽ trả về kết quả này.
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
                  Mức độ: {severityLabels[finding.severity]}
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
      <details className="jp-scan-disclosure">
        <summary>Xem bản nội dung đã phân tích</summary>
        <p>
          Đánh dấu chỉ áp dụng cho bản lưu bên dưới, bao gồm nhãn trường và nội dung đã gửi phân
          tích.
        </p>
        <Snapshot scan={scan} />
      </details>
    </div>
  );
}

export function JobScanPanel({
  job,
  busy,
  editable,
  localEdits,
  editSequence,
  prepare,
  recover,
  onResult,
  compact = false,
  editorMode = false,
  editorTarget,
  autoReady = false,
}: {
  job: Job | null;
  busy: boolean;
  editable: boolean;
  localEdits: boolean;
  editSequence: number;
  prepare: () => Promise<Job>;
  recover: (jobId: number) => Promise<Job>;
  onResult?: (scan: ScanView | null, outdated: boolean) => void;
  compact?: boolean;
  editorMode?: boolean;
  editorTarget?: HTMLElement | null;
  autoReady?: boolean;
}) {
  const [scan, setScan] = useState<ScanView | null>(null);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [analyzedSequence, setAnalyzedSequence] = useState(-1);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const currentRevision = useRef(job?.workingRevision?.id);
  currentRevision.current = job?.workingRevision?.id;
  const sequence = useRef(editSequence);
  sequence.current = editSequence;
  const previousRevision = useRef(currentRevision.current);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (previousRevision.current !== job?.workingRevision?.id) {
      previousRevision.current = job?.workingRevision?.id;
      setScan(null);
    }
  }, [job?.workingRevision?.id]);
  const jobId = job?.id;
  const revisionId = job?.workingRevision?.id;
  useEffect(() => {
    if (!scanProcessing(scan) || !scan || !jobId || scan.revisionId !== revisionId) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getJobScan(jobId!, scan.revisionId, scan.scanId, abort.signal);
        if (!abort.signal.aborted && currentRevision.current === next.revisionId) setScan(next);
      } catch (cause) {
        if (!abort.signal.aborted) {
          setError(jobError(cause));
          if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) setScan(null);
        }
      }
    };
    if (!error) timer = setTimeout(() => void poll(), 2000);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [scan, jobId, revisionId, error]);
  const start = async () => {
    if (requesting || busy) return;
    setRequesting(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    const atSequence = sequence.current;
    try {
      let saved = await prepare();
      if (!mounted.current || abort.signal.aborted) return;
      let result: ScanView;
      try {
        if (!saved.workingRevision) throw new Error("Missing revision");
        result = await requestJobScan(
          saved.id,
          saved.workingRevision.id,
          saved.workingRevision.version,
          abort.signal,
        );
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.status !== 409) throw cause;
        saved = await recover(saved.id);
        if (!mounted.current || abort.signal.aborted || !saved.workingRevision) return;
        result = await requestJobScan(
          saved.id,
          saved.workingRevision.id,
          saved.workingRevision.version,
          abort.signal,
        );
      }
      if (
        mounted.current &&
        !abort.signal.aborted &&
        currentRevision.current === result.revisionId
      ) {
        setScan(result);
        setAnalyzedSequence(atSequence);
      }
    } catch (cause) {
      if (mounted.current && !abort.signal.aborted)
        setError(
          cause instanceof ApiError && cause.status === 503
            ? "Tính năng kiểm tra nội dung hiện đang tắt. Bạn vẫn có thể gửi duyệt bình thường."
            : cause instanceof ApiError && cause.status === 400
              ? "Vui lòng nhập mô tả công việc và kiểm tra yêu cầu phân tích hợp lệ."
              : jobError(cause),
        );
    } finally {
      if (mounted.current) setRequesting(false);
    }
  };
  // Keep one scan controller mounted across tabs. A new edit restarts the idle delay.
  const startRef = useRef(start);
  startRef.current = start;
  const attemptedSequence = useRef<number | null>(null);
  useEffect(() => {
    if (!editorMode || !autoReady || busy || requesting || localEdits || scanProcessing(scan))
      return;
    if (
      attemptedSequence.current === editSequence ||
      (scan?.status === "COMPLETED" && analyzedSequence === editSequence)
    )
      return;
    const timer = setTimeout(() => {
      attemptedSequence.current = editSequence;
      void startRef.current();
    }, 5000);
    return () => clearTimeout(timer);
  }, [editorMode, autoReady, busy, requesting, localEdits, scan, editSequence, analyzedSequence]);
  const processing = scanProcessing(scan);
  const outdated =
    editSequence !== analyzedSequence ||
    localEdits ||
    scan?.revisionVersion !== job?.workingRevision?.version;
  useEffect(() => {
    onResult?.(scan, outdated);
  }, [scan, outdated, onResult]);
  if (editorMode) {
    const message =
      error ||
      (requesting
        ? "Đang lưu bản nháp và phân tích…"
        : processing
          ? "AI đang phân tích nội dung…"
          : !autoReady
            ? "Nhập mô tả công việc để AI kiểm tra."
            : outdated || !scan
              ? "AI tự kiểm tra sau khi bạn ngừng nhập 5 giây. Bản nháp sẽ được lưu."
              : scan.status === "FAILED"
                ? "Chưa thể phân tích nội dung. Bạn vẫn có thể tiếp tục soạn tin."
                : scan.mode === "stub" || scan.report?.mode === "stub"
                  ? "Chế độ thử nghiệm — chưa thực hiện phân tích AI"
                  : `${scan.report?.findings.length ?? 0} phát hiện · Di chuột hoặc dùng Tab đến phần đánh dấu để xem.`);
    return editorTarget
      ? createPortal(
          <div className="jp-editor-analysis-status" role={error ? "alert" : "status"}>
            <span>{message}</span>
            {(error || scan?.status === "FAILED") && (
              <button
                type="button"
                disabled={busy || requesting || processing}
                onClick={() => void start()}
              >
                Thử lại
              </button>
            )}
          </div>,
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
        {editable && (
          <button
            type="button"
            className="jp-button"
            disabled={busy || requesting || processing || localEdits}
            onClick={() => void start()}
          >
            {requesting ? "Đang lưu và yêu cầu phân tích…" : "Kiểm tra nội dung với AI"}
          </button>
        )}
      </div>
      {!compact && (
        <p className="jp-scan-revision">
          {job?.workingRevision
            ? `Bản v${job.workingRevision.revisionNumber} · Nội dung đang làm việc`
            : "Bản nháp chưa lưu"}
        </p>
      )}
      {!compact && editable && !scan && !error && (
        <p className="jp-scan-hint">
          Bản nháp sẽ được lưu trước khi phân tích. Cần có mô tả công việc.
        </p>
      )}
      {error && (
        <p className="jp-feedback jp-error" role="alert">
          {error}
        </p>
      )}
      {compact &&
        scan?.status === "COMPLETED" &&
        (scan.mode === "stub" || scan.report?.mode === "stub") && (
          <p className="jp-feedback jp-warning">Chế độ thử nghiệm — chưa thực hiện phân tích AI</p>
        )}
      {scan && (!compact || scan.status !== "COMPLETED") && (
        <ScanResult scan={scan} outdated={outdated} />
      )}
    </section>
  );
}
