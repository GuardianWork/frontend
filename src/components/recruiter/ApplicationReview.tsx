import { STATUS_LABELS, REJECTION_LABELS, applicationDate } from "./application-labels";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown } from "lucide-react";
import { ApplicationStatusIcon } from "@/components/icons/ApplicationStatusIcon";
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
  REJECTED: "danger",
  WITHDRAWN: "neutral",
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
function PdfViewer({
  detail,
  onUnavailable,
}: {
  detail: ApplicationDetail;
  onUnavailable: () => void;
}) {
  const [requested, setRequested] = useState(false);
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const unavailable = useRef(onUnavailable);
  unavailable.current = onUnavailable;
  useEffect(() => {
    if (!requested) return;
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
        setError(reason);
        if (reason instanceof ApiError && [401, 403, 404].includes(reason.status))
          unavailable.current();
      });
    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requested, attempt, detail.id, detail.jobId]);
  const isPdf = detail.cvContentType?.toLowerCase() === "application/pdf";
  return (
    <section className="application-evidence">
      <h2>CV đã gửi</h2>
      <p className="application-file-name">{detail.cvFileName || "Không có thông tin CV"}</p>
      {detail.cvFileName && (
        <p className="application-muted">
          {detail.cvContentType?.includes("pdf") ? "PDF" : "DOC / DOCX"} ·{" "}
          {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
            detail.cvFileSize / 1024,
          )}{" "}
          KB
        </p>
      )}
      {!isPdf ? (
        <p className="application-muted">
          {detail.cvFileName ? "Chỉ hỗ trợ xem trực tuyến CV định dạng PDF." : "CV không khả dụng."}
        </p>
      ) : !requested ? (
        <button className="jp-button" onClick={() => setRequested(true)}>
          Xem CV PDF
        </button>
      ) : error ? (
        <div role="alert">
          <p>{errorMessage(error)}</p>
          <button
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
        <p role="status">Đang tải CV…</p>
      ) : (
        <>
          <iframe className="application-pdf" src={url} title={`CV của ${detail.candidateName}`} />
          <button
            className="jp-button"
            onClick={() => {
              setRequested(false);
              setUrl(undefined);
            }}
          >
            Đóng CV
          </button>
        </>
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
  const terminal = detail && ["REJECTED", "WITHDRAWN"].includes(detail.status);
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
        if (!lock.current) setMenuOpen(open);
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
                  {detail.status === "SUBMITTED" && (
                    <DropdownMenuItem
                      disabled={busy || blocked}
                      onSelect={(event) => {
                        event.preventDefault();
                        void save({ status: "UNDER_REVIEW", version: detail.version });
                      }}
                    >
                      <ApplicationStatusIcon status="UNDER_REVIEW" size={18} />
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
                      <ApplicationStatusIcon status="SHORTLISTED" size={18} />
                      {STATUS_LABELS.SHORTLISTED}
                    </DropdownMenuItem>
                  )}
                  {["SUBMITTED", "UNDER_REVIEW"].includes(detail.status) && (
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
                    <ApplicationStatusIcon status="REJECTED" size={18} />
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
                {terminal ? (
                  <p className="application-terminal">
                    {detail.status === "WITHDRAWN"
                      ? "Ứng viên đã rút đơn."
                      : "Đơn ứng tuyển đã bị từ chối."}{" "}
                    Không thể thay đổi trạng thái. Thông tin liên hệ, thư ứng tuyển và CV không còn
                    khả dụng.
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
                    <PdfViewer
                      key={`${detail.id}:${detail.version}`}
                      detail={detail}
                      onUnavailable={() => {
                        setError(new ApiError("", 404));
                        void query.refetch();
                      }}
                    />
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
