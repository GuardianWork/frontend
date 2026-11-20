import { STATUS_LABELS, REJECTION_LABELS, applicationDate } from "./application-labels";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SuspendedJobError } from "@/services/recruiterJobAccess";
import { SuspendedJobNotice } from "./RecruiterJobGate";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  CircleX,
  Download,
  FileSearch,
  ListChecks,
  MessagesSquare,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { CloseIcon, CvIcon, LoadingIcon, UnavailableEvidenceIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/services/api";
import {
  changeApplicationStatus,
  getApplicationCvDownloadUrl,
  getApplicationPdf,
  getRecruiterApplication,
  type ApplicationDetail,
  type ApplicationStatus,
  type RejectionReason,
  type StatusChange,
} from "@/services/recruiterApplications";

const TONES: Record<ApplicationStatus, string> = {
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  SHORTLISTED: "success",
  INTERVIEWING: "info",
  HIRED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
  INACTIVE: "neutral",
};
export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`status-tag status-tag--${TONES[status]}`}>{STATUS_LABELS[status]}</span>;
}
function errorMessage(error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 409)
    return "Đơn ứng tuyển đã thay đổi. Tải lại hồ sơ để xem trạng thái mới trước khi tiếp tục.";
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 403 || status === 404)
    return "Hồ sơ không còn khả dụng hoặc bạn không còn quyền truy cập. Vui lòng quay lại danh sách.";
  if (status === 406) return "CV này không hỗ trợ xem trực tuyến. Chỉ có thể xem tệp PDF.";
  if (status === 400)
    return "Thông tin cập nhật không hợp lệ. Vui lòng kiểm tra lý do và nội dung đã nhập.";
  return "Không thể tải hoặc cập nhật hồ sơ. Vui lòng thử lại.";
}
function cvErrorMessage(error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 404 || status === 403) return "CV không còn khả dụng hoặc quyền xem đã kết thúc.";
  if (status === 406) return "Chỉ có thể xem trực tuyến CV PDF. Hãy tải xuống để xem tệp này.";
  if (status === 503) return "Dịch vụ lưu trữ CV tạm thời không khả dụng. Vui lòng thử lại sau.";
  return "Không thể tải CV. Vui lòng thử lại.";
}

function PdfViewer({ detail }: { detail: ApplicationDetail }) {
  const [requested, setRequested] = useState(false);
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<unknown>();
  const canView = detail.canViewCv && Boolean(detail.cvFileName);
  const isPdf = detail.cvContentType?.toLowerCase() === "application/pdf";
  useEffect(() => {
    if (!requested || !canView) return;
    const controller = new AbortController();
    let disposed = false;
    let objectUrl: string | undefined;
    getApplicationPdf(detail.jobId, detail.id, controller.signal)
      .then((blob) => {
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((reason: unknown) => {
        if (disposed) return;
        // A CV-only 404 means the grant or source is gone; it must not conceal the
        // Application detail, which remains readable while the row is active.
        setError(reason);
      });
    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requested, attempt, canView, detail.id, detail.jobId]);
  async function download() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(undefined);
    try {
      const result = await getApplicationCvDownloadUrl(detail.jobId, detail.id);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (reason: unknown) {
      setDownloadError(reason);
    } finally {
      setDownloading(false);
    }
  }
  const size = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
    detail.cvFileSize / 1024,
  );
  const downloadAction = (
    <button
      type="button"
      className={`jp-button${isPdf ? "" : " jp-primary"}`}
      disabled={downloading}
      onClick={() => void download()}
    >
      <Download size={16} aria-hidden="true" />
      {downloading ? "Đang tạo liên kết…" : "Tải xuống CV"}
    </button>
  );
  return (
    <section className="application-evidence" aria-labelledby="application-evidence-title">
      <h2 id="application-evidence-title">CV đã gửi</h2>
      {!canView ? (
        <div className="application-file application-file--unavailable">
          <span className="application-file-mark" aria-hidden="true">
            <UnavailableEvidenceIcon size={24} />
          </span>
          <div className="application-file-copy">
            <p className="application-file-name">{detail.cvFileName || "CV không còn khả dụng"}</p>
            <p className="application-file-note">
              {detail.status === "INACTIVE"
                ? "Đơn đang tạm dừng xử lý nên CV tạm thời không khả dụng."
                : "CV không còn khả dụng hoặc quyền xem đã kết thúc."}
            </p>
          </div>
        </div>
      ) : (
        <div className={`application-file${requested ? " application-file--open" : ""}`}>
          <div className="application-file-head">
            <span className="application-file-mark" aria-hidden="true">
              <CvIcon size={24} />
            </span>
            <div className="application-file-copy">
              <p className="application-file-name">
                {detail.cvFileName || "Không có thông tin CV"}
              </p>
              <p className="application-file-meta">
                <span>{isPdf ? "PDF" : "DOC / DOCX"}</span>
                <span aria-hidden="true">·</span>
                <span>{size} KB</span>
              </p>
              {detail.reviewWindowEndsAt && (
                <p className="application-file-note">
                  Quyền xem CV đã gửi còn hiệu lực đến {applicationDate(detail.reviewWindowEndsAt)}.
                </p>
              )}
              {!isPdf && (
                <p className="application-file-note">
                  CV định dạng DOC / DOCX không hỗ trợ xem trực tuyến. Hãy tải xuống để xem.
                </p>
              )}
            </div>
            <div className="application-file-actions">
              {requested && downloadAction}
              {isPdf && (
                <button
                  type="button"
                  className={`jp-button${requested ? "" : " jp-primary"}`}
                  aria-expanded={requested}
                  aria-controls={requested ? "application-evidence-viewer" : undefined}
                  onClick={() => {
                    if (requested) {
                      setRequested(false);
                      setUrl(undefined);
                      setError(undefined);
                    } else {
                      setRequested(true);
                    }
                  }}
                >
                  {requested ? (
                    <>
                      <CloseIcon size={16} aria-hidden="true" />
                      Đóng CV
                    </>
                  ) : (
                    "Xem CV PDF"
                  )}
                </button>
              )}
              {(!isPdf || !requested) && downloadAction}
            </div>
          </div>
          {requested && isPdf && (
            <div
              className="application-file-viewer"
              id="application-evidence-viewer"
              aria-busy={!error && !url}
            >
              {error ? (
                <div className="application-file-state application-file-state--error" role="alert">
                  <p>{cvErrorMessage(error)}</p>
                  <button
                    type="button"
                    className="jp-button"
                    onClick={() => {
                      setError(undefined);
                      setAttempt((value) => value + 1);
                    }}
                  >
                    Thử lại CV
                  </button>
                </div>
              ) : !url ? (
                <div className="application-file-state" role="status">
                  <LoadingIcon size={20} className="application-file-spinner" />
                  <p>Đang tải CV…</p>
                </div>
              ) : (
                <iframe
                  className="application-pdf"
                  src={url}
                  title={`CV của ${detail.candidateName}`}
                />
              )}
            </div>
          )}
          {Boolean(downloadError) && (
            <div className="application-file-download-error" role="alert">
              <p>{cvErrorMessage(downloadError)}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ApplicationReview({
  jobId,
  id,
  scope,
  mode = "page",
  candidateName,
  status,
  onListRefresh,
}: {
  jobId: number;
  id: string;
  scope: string;
  mode?: "page" | "menu";
  candidateName?: string;
  status?: ApplicationStatus;
  onListRefresh?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const key = ["recruiter-application-detail", scope, jobId, id];
  const query = useQuery({
    enabled: mode === "page" || menuOpen,
    queryKey: key,
    queryFn: ({ signal }) => getRecruiterApplication(jobId, id, signal),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: "always",
  });
  const [hiring, setHiring] = useState(false);
  const [hiringConfirmed, setHiringConfirmed] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<RejectionReason | "">("");
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  const blocked = error instanceof ApiError && [401, 403, 404, 409].includes(error.status);
  const concealed = error instanceof ApiError && [401, 403, 404, 409].includes(error.status);
  const detail = !query.isError && !query.isFetching && !concealed ? query.data : undefined;
  const terminal = detail && ["HIRED", "REJECTED", "WITHDRAWN"].includes(detail.status);
  const privateEvidence = detail && ["REJECTED", "WITHDRAWN"].includes(detail.status);
  const overLimit =
    Array.from(explanation.trim()).length > 1000 || Array.from(feedback.trim()).length > 1000;
  const rejectValid = reason && (reason !== "OTHER" || explanation.trim()) && !overLimit;
  async function save(change: StatusChange) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      await client.cancelQueries({ queryKey: key });
      const updated = await changeApplicationStatus(jobId, id, change);
      client.setQueryData(key, updated);
      setHiring(false);
      setHiringConfirmed(false);
      setRejecting(false);
      setMenuOpen(false);
      setExplanation("");
      setFeedback("");
      setReason("");
      setNotice(`Đã cập nhật: ${STATUS_LABELS[updated.status]}.`);
      onListRefresh?.();
      await client.invalidateQueries({ queryKey: ["recruiter-applications", scope] });
    } catch (reason: unknown) {
      setError(reason);
      if (reason instanceof ApiError && [401, 403, 404, 409].includes(reason.status)) {
        setRejecting(false);
        setMenuOpen(false);
        if (reason.status !== 409) client.removeQueries({ queryKey: key });
        onListRefresh?.();
        await client.invalidateQueries({ queryKey: ["recruiter-applications", scope] });
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const displayedStatus = mode === "menu" ? status : detail?.status;
  const statusControl = displayedStatus ? (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        if (!lock.current) {
          if (open && mode === "menu") setError(undefined);
          setMenuOpen(open);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          ref={menuTrigger}
          className="application-status-trigger"
          aria-label={`Cập nhật trạng thái của ${candidateName ?? detail?.candidateName}`}
        >
          <ApplicationBadge status={displayedStatus} />
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="application-status-menu">
        <div className="application-status-menu-header">
          <p className="application-menu-heading">Cập nhật trạng thái</p>
          <div className="application-status-current">
            <span>Hiện tại</span>
            <ApplicationBadge status={detail?.status ?? displayedStatus} />
          </div>
        </div>
        <div className="application-menu-options">
          {query.isFetching && (
            <p className="application-menu-message" role="status">
              Đang tải trạng thái…
            </p>
          )}
          {(query.isError || Boolean(error)) && (
            <div role="alert">
              <p>{errorMessage(query.error || error)}</p>
              <DropdownMenuItem
                disabled={busy || query.isFetching}
                onSelect={(event) => {
                  event.preventDefault();
                  setError(undefined);
                  void query.refetch();
                }}
              >
                Tải lại trạng thái
              </DropdownMenuItem>
            </div>
          )}
          {detail && (
            <>
              {terminal ? (
                <p className="application-menu-message">Đơn ứng tuyển đã kết thúc</p>
              ) : (
                <>
                  {detail.status === "INACTIVE" && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={(event) => {
                        event.preventDefault();
                        void save({ status: "UNDER_REVIEW", version: detail.version });
                      }}
                    >
                      <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />
                      Mở lại xét duyệt
                    </DropdownMenuItem>
                  )}
                  {detail.status === "SUBMITTED" && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={(event) => {
                        event.preventDefault();
                        void save({ status: "UNDER_REVIEW", version: detail.version });
                      }}
                    >
                      <FileSearch size={18} strokeWidth={1.75} aria-hidden="true" />
                      {STATUS_LABELS.UNDER_REVIEW}
                    </DropdownMenuItem>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW"].includes(detail.status) && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={(event) => {
                        event.preventDefault();
                        void save({ status: "SHORTLISTED", version: detail.version });
                      }}
                    >
                      <ListChecks size={18} strokeWidth={1.75} aria-hidden="true" />
                      {STATUS_LABELS.SHORTLISTED}
                    </DropdownMenuItem>
                  )}
                  {["UNDER_REVIEW", "SHORTLISTED"].includes(detail.status) && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={(event) => {
                        event.preventDefault();
                        void save({ status: "INTERVIEWING", version: detail.version });
                      }}
                    >
                      <MessagesSquare size={18} strokeWidth={1.75} aria-hidden="true" />
                      Phỏng vấn
                    </DropdownMenuItem>
                  )}
                  {["UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING"].includes(detail.status) && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={() => {
                        setError(undefined);
                        setHiringConfirmed(false);
                        setHiring(true);
                      }}
                    >
                      <UserCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                      Nhận việc…
                    </DropdownMenuItem>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING"].includes(
                    detail.status,
                  ) && <DropdownMenuSeparator className="application-menu-divider" />}
                  {detail.status === "INACTIVE" && (
                    <DropdownMenuSeparator className="application-menu-divider" />
                  )}
                  <DropdownMenuItem
                    className="application-menu-reject"
                    disabled={busy || blocked}
                    onSelect={() => {
                      setError(undefined);
                      setRejecting(true);
                    }}
                  >
                    <CircleX size={18} strokeWidth={1.75} aria-hidden="true" />
                    Từ chối
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
          {busy && (
            <p className="application-menu-message" role="status">
              Đang cập nhật…
            </p>
          )}
        </div>
        {detail && !terminal && (
          <div className="application-status-menu-footer">
            <Bell size={16} aria-hidden="true" />
            <p>Ứng viên sẽ nhận thông báo khi trạng thái thay đổi.</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
  if (query.error instanceof SuspendedJobError || error instanceof SuspendedJobError)
    return <SuspendedJobNotice />;
  return (
    <>
      {mode === "menu" ? (
        <>
          {statusControl}
          {notice && (
            <p className="sr-only" role="status">
              {notice}
            </p>
          )}
        </>
      ) : (
        <article
          className="application-review application-review--page"
          aria-labelledby="application-review-title"
          aria-busy={busy || query.isFetching}
        >
          <header className="application-review-header">
            <h1 id="application-review-title" ref={title} tabIndex={-1}>
              Chi tiết đơn ứng tuyển
            </h1>
          </header>
          <div className="application-review-body">
            {notice && (
              <p className="application-notice" role="status">
                {notice}
              </p>
            )}
            {(query.isError || Boolean(error)) && (
              <div role="alert">
                <p>{errorMessage(query.error || error)}</p>
                {(query.error instanceof ApiError && query.error.status === 401) ||
                (error instanceof ApiError && error.status === 401) ? (
                  <Link className="jp-button" to="/login">
                    Đăng nhập
                  </Link>
                ) : (
                  <button
                    className="jp-button"
                    disabled={busy || query.isFetching}
                    onClick={() => {
                      setError(undefined);
                      setNotice("");
                      void query.refetch();
                    }}
                  >
                    Tải lại hồ sơ
                  </button>
                )}
              </div>
            )}
            {query.isFetching && <p role="status">Đang tải hồ sơ…</p>}
            {detail && (
              <>
                <div className="application-review-identity">
                  <h2>{detail.candidateName}</h2>
                  <p>{detail.jobTitle}</p>
                  {statusControl}
                  <p className="application-muted">
                    Ứng tuyển lúc {applicationDate(detail.appliedAt)}
                  </p>
                </div>
                {detail.status === "INACTIVE" && (
                  <p className="application-terminal">
                    Đơn đang tạm dừng xử lý. Công ty có thể mở lại qua trạng thái Đang xem xét.
                  </p>
                )}
                {!terminal && detail.status !== "INACTIVE" && detail.inactivityDeadline && (
                  <p className="application-muted">
                    Đơn sẽ tạm dừng nếu không có cập nhật trạng thái trước{" "}
                    {applicationDate(detail.inactivityDeadline)}.
                  </p>
                )}
                {privateEvidence ? (
                  <p className="application-terminal">
                    {detail.status === "WITHDRAWN"
                      ? "Ứng viên đã rút đơn."
                      : "Đơn ứng tuyển đã bị từ chối."}{" "}
                    Hồ sơ không còn khả dụng.
                  </p>
                ) : (
                  <>
                    <section>
                      <h2>Thông tin đã gửi</h2>
                      <dl className="application-contact">
                        <div>
                          <dt>Email</dt>
                          <dd>{detail.email || "Chưa cung cấp"}</dd>
                        </div>
                        <div>
                          <dt>Số điện thoại</dt>
                          <dd>{detail.phoneNumber || "Chưa cung cấp"}</dd>
                        </div>
                      </dl>
                    </section>
                    {detail.coverLetter && (
                      <section>
                        <h2>Thư ứng tuyển</h2>
                        <p className="application-long-text">{detail.coverLetter}</p>
                      </section>
                    )}
                    <PdfViewer key={`${detail.id}:${detail.version}`} detail={detail} />
                  </>
                )}
                <section className="application-history">
                  <h2>Lịch sử trạng thái</h2>
                  {!detail.history.length ? (
                    <p className="application-muted">Chưa có lịch sử trạng thái.</p>
                  ) : (
                    <ol>
                      {detail.history.map((event, index) => (
                        <li key={`${event.occurredAt}:${index}`}>
                          <strong>{STATUS_LABELS[event.toStatus]}</strong>
                          <p className="application-muted">
                            <time dateTime={event.occurredAt}>
                              {applicationDate(event.occurredAt)}
                            </time>
                            {` · Người thực hiện: ${event.actorName?.trim() || "Chưa có thông tin"}`}
                          </p>
                          {event.rejectionReason && (
                            <p>
                              <b>Lý do nội bộ: </b>
                              {REJECTION_LABELS[event.rejectionReason] || event.rejectionReason}
                            </p>
                          )}
                          {event.internalExplanation && (
                            <p className="application-long-text">
                              <b>Giải thích nội bộ: </b>
                              {event.internalExplanation}
                            </p>
                          )}
                          {event.candidateFeedback && (
                            <p className="application-long-text">
                              <b>Phản hồi cho ứng viên: </b>
                              {event.candidateFeedback}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </div>
        </article>
      )}
      <Dialog
        open={hiring}
        onOpenChange={(open) => {
          if (!lock.current) setHiring(open);
        }}
      >
        <DialogContent
          className="application-rejection-dialog"
          hideClose={busy}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            if (menuTrigger.current?.isConnected) {
              event.preventDefault();
              menuTrigger.current.focus();
            }
          }}
        >
          <DialogTitle>Nhận việc</DialogTitle>
          <DialogDescription>
            Ghi nhận {candidateName ?? detail?.candidateName} đã đồng ý gia nhập sau khi trao đổi
            ngoài GuardianWork. Quyết định này là cuối cùng: không thể từ chối, rút đơn hoặc thay
            đổi trạng thái sau đó.
          </DialogDescription>
          <label className="application-hiring-confirmation">
            <input
              type="checkbox"
              checked={hiringConfirmed}
              disabled={busy}
              onChange={(event) => setHiringConfirmed(event.target.checked)}
            />
            <span>Tôi xác nhận ứng viên đã đồng ý gia nhập doanh nghiệp.</span>
          </label>
          {Boolean(error) && <p role="alert">{errorMessage(error)}</p>}
          <div className="application-dialog-actions">
            <button className="jp-button" disabled={busy} onClick={() => setHiring(false)}>
              Hủy
            </button>
            <button
              className="jp-button jp-button--primary"
              disabled={busy || !hiringConfirmed || !detail || blocked}
              onClick={() => {
                if (detail && hiringConfirmed)
                  void save({ status: "HIRED", version: detail.version, hiringConfirmed: true });
              }}
            >
              {busy ? "Đang xác nhận…" : "Xác nhận đã tuyển"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={rejecting}
        onOpenChange={(open) => {
          if (!lock.current) setRejecting(open);
        }}
      >
        <DialogContent
          className="application-rejection-dialog"
          hideClose={busy}
          onCloseAutoFocus={(event) => {
            if (mode === "menu" && menuTrigger.current?.isConnected) {
              event.preventDefault();
              menuTrigger.current.focus();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>Từ chối đơn ứng tuyển</DialogTitle>
          <DialogDescription>
            Quyết định này là cuối cùng. Sau khi từ chối, bạn sẽ không thể xem thông tin liên hệ,
            thư ứng tuyển hoặc CV của ứng viên.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (rejectValid && detail)
                void save({
                  status: "REJECTED",
                  version: detail.version,
                  rejectionReason: reason as RejectionReason,
                  ...(explanation.trim() ? { internalExplanation: explanation.trim() } : {}),
                  ...(feedback.trim() ? { candidateFeedback: feedback.trim() } : {}),
                });
            }}
          >
            <label htmlFor="application-reason">
              Lý do nội bộ <span>(bắt buộc)</span>
            </label>
            <select
              id="application-reason"
              value={reason}
              required
              disabled={busy}
              onChange={(event) => setReason(event.target.value as RejectionReason)}
            >
              <option value="" disabled>
                Chọn lý do từ chối
              </option>
              {Object.entries(REJECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="application-muted">
              Chỉ doanh nghiệp xem được lý do và giải thích nội bộ.
            </p>
            <label htmlFor="application-explanation">
              Giải thích nội bộ {reason === "OTHER" ? "(bắt buộc)" : "(tùy chọn)"}
            </label>
            <textarea
              id="application-explanation"
              value={explanation}
              required={reason === "OTHER"}
              disabled={busy}
              aria-describedby="explanation-count"
              aria-invalid={Array.from(explanation.trim()).length > 1000}
              onChange={(event) => setExplanation(event.target.value)}
              rows={3}
            />
            <p id="explanation-count" className="application-muted">
              {Array.from(explanation.trim()).length}/1000 ký tự
            </p>
            <label htmlFor="application-feedback">Phản hồi cho ứng viên (tùy chọn)</label>
            <textarea
              id="application-feedback"
              value={feedback}
              disabled={busy}
              aria-describedby="feedback-count"
              aria-invalid={Array.from(feedback.trim()).length > 1000}
              onChange={(event) => setFeedback(event.target.value)}
              rows={3}
            />
            <p id="feedback-count" className="application-muted">
              {Array.from(feedback.trim()).length}/1000 ký tự · Nội dung này sẽ được gửi cho ứng
              viên.
            </p>
            {Boolean(error) && <p role="alert">{errorMessage(error)}</p>}
            {overLimit && <p role="alert">Mỗi nội dung chỉ được tối đa 1000 ký tự.</p>}
            <div className="application-dialog-actions">
              <button
                type="button"
                className="jp-button"
                disabled={busy}
                onClick={() => setRejecting(false)}
              >
                Hủy
              </button>
              <button
                className="jp-button application-reject-confirm"
                disabled={busy || !rejectValid}
              >
                {busy ? "Đang từ chối…" : "Xác nhận từ chối"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
