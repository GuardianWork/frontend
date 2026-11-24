import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  MapPin,
  RotateCw,
  SearchX,
  ShieldAlert,
  Undo2,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ApplicationIcon, SearchIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/services/api";
import {
  getCandidateApplication,
  getCandidateApplicationCvDownloadUrl,
  locateApplicationPage,
  withdrawApplication,
  listApplicationCounts,
  listApplicationPage,
  type SubmittedApplication,
  type CandidateApplicationDetail,
} from "@/services/candidateApplications";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import "./my-jobs.css";

const PAGE_SIZE = 10;
const MAX_SEARCH_LENGTH = 150;

type StatusTone = "info" | "success" | "warning" | "danger" | "neutral";

const STATUS_META: Record<
  string,
  {
    vi: string;
    en: string;
    tone: StatusTone;
    viDetail: string;
    enDetail: string;
  }
> = {
  SUBMITTED: {
    vi: "Đã ứng tuyển",
    en: "Submitted",
    tone: "info",
    viDetail: "Hồ sơ đã được gửi tới nhà tuyển dụng và đang chờ phản hồi.",
    enDetail: "Your CV has been sent to the recruiter and is awaiting a response.",
  },
  UNDER_REVIEW: {
    vi: "Đang xem xét",
    en: "Under review",
    tone: "warning",
    viDetail: "Nhà tuyển dụng đang xem xét hồ sơ ứng tuyển của bạn.",
    enDetail: "The recruiter is reviewing your application.",
  },
  INTERVIEWING: {
    vi: "Phỏng vấn",
    en: "Interviewing",
    tone: "info",
    viDetail:
      "Hồ sơ đã chuyển sang vòng phỏng vấn. Nhà tuyển dụng sẽ liên hệ để trao đổi chi tiết.",
    enDetail:
      "Your application has progressed to interviews. The recruiter will contact you with details.",
  },
  HIRED: {
    vi: "Đã tuyển",
    en: "Hired",
    tone: "success",
    viDetail:
      "Công ty đã xác nhận bạn đồng ý gia nhập. Nhà tuyển dụng sẽ liên hệ về các bước tiếp theo.",
    enDetail:
      "The company has confirmed you agreed to join. The recruiter will contact you about next steps.",
  },
  REJECTED: {
    vi: "Hồ sơ bị từ chối",
    en: "Rejected",
    tone: "danger",
    viDetail: "Nhà tuyển dụng đã từ chối hồ sơ ứng tuyển này.",
    enDetail: "The recruiter has rejected this application.",
  },
  WITHDRAWN: {
    vi: "Đã rút",
    en: "Withdrawn",
    tone: "neutral",
    viDetail: "Đơn ứng tuyển đã được rút khỏi quy trình tuyển dụng.",
    enDetail: "This application has been withdrawn from the hiring process.",
  },
  INACTIVE: {
    vi: "Tạm dừng xử lý",
    en: "Processing paused",
    tone: "neutral",
    viDetail:
      "Đơn đang tạm dừng xử lý vì công ty chưa cập nhật trạng thái trong thời gian dài. Bạn vẫn có thể rút đơn hoặc chờ công ty mở lại.",
    enDetail:
      "This application is paused because the company has not updated its status for a long time. You can still withdraw or wait for the company to reopen it.",
  },
};

const STATUS_FILTERS = [
  { value: "", vi: "Tất cả", en: "All" },
  { value: "SUBMITTED", vi: "Đã ứng tuyển", en: "Submitted" },
  { value: "UNDER_REVIEW", vi: "Đang xem xét", en: "Under review" },
  { value: "INTERVIEWING", vi: "Phỏng vấn", en: "Interviewing" },
  { value: "INACTIVE", vi: "Tạm dừng xử lý", en: "Processing paused" },
  { value: "HIRED", vi: "Đã tuyển", en: "Hired" },
  { value: "REJECTED", vi: "Đã từ chối", en: "Rejected" },
  { value: "WITHDRAWN", vi: "Đã rút", en: "Withdrawn" },
] as const;

const STATUS_COUNT_KEYS = {
  "": "all",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "underReview",
  INTERVIEWING: "interviewing",
  INACTIVE: "inactive",
  HIRED: "hired",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
} as const;

const WORK_MODE_LABELS: Record<string, { vn: string; en: string }> = {
  ONSITE: { vn: "Tại văn phòng", en: "On-site" },
  ON_SITE: { vn: "Tại văn phòng", en: "On-site" },
  OFFICE: { vn: "Tại văn phòng", en: "On-site" },
  REMOTE: { vn: "Từ xa", en: "Remote" },
  HYBRID: { vn: "Kết hợp", en: "Hybrid" },
  FIELD: { vn: "Ngoài thực địa", en: "Field" },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      vi: status,
      en: status,
      tone: "neutral" as const,
      viDetail: "",
      enDetail: "",
    }
  );
}

function formatDate(value: string, locale: "vn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Clock time for history events, so same-day changes stay distinguishable. */
function formatTime(value: string, locale: "vn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatRelativeDate(value: string, locale: "vn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const difference = date.getTime() - Date.now();
  const absolute = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "vi", {
    numeric: "auto",
  });
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absolute < hour) return formatter.format(Math.round(difference / minute), "minute");
  if (absolute < day) return formatter.format(Math.round(difference / hour), "hour");
  if (absolute < 90 * day) return formatter.format(Math.round(difference / day), "day");
  if (absolute < 365 * day) return formatter.format(Math.round(difference / (30 * day)), "month");
  return formatter.format(Math.round(difference / (365 * day)), "year");
}

function workModeLabel(value: string, locale: "vn" | "en") {
  const key = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return WORK_MODE_LABELS[key]?.[locale] ?? value;
}

/** Date-only deadlines stay open through the end of that local day. */
function hasDeadlinePassed(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) date.setHours(23, 59, 59, 999);
  return date.getTime() < Date.now();
}

function ApplicationProgress({
  id,
  en,
  query,
  suspended,
}: {
  id: string;
  en: boolean;
  query: UseQueryResult<CandidateApplicationDetail, Error>;
  suspended: boolean;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [downloadingCv, setDownloadingCv] = useState(false);
  const [cvError, setCvError] = useState(false);
  const lock = useRef(false);
  const withdrawTrigger = useRef<HTMLButtonElement>(null);
  const detail = query.data;
  const active =
    detail &&
    ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING", "INACTIVE"].includes(
      detail.status,
    );
  // History reads newest → oldest regardless of the order the API returns.
  const events = useMemo(() => {
    const history = detail?.history ?? [];
    return history
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const difference = Date.parse(b.event.occurredAt) - Date.parse(a.event.occurredAt);
        return difference !== 0 ? difference : a.index - b.index;
      })
      .map(({ event }) => event);
  }, [detail]);
  const headingId = useId();
  const message = (reason: unknown) =>
    reason instanceof ApiError && reason.status === 409
      ? en
        ? "This application changed. Reload its status before continuing."
        : "Đơn đã thay đổi. Tải lại trạng thái trước khi tiếp tục."
      : en
        ? "Application unavailable. Reload to try again."
        : "Đơn ứng tuyển chưa khả dụng. Tải lại để thử lại.";
  return (
    <section className="candidate-application-progress" aria-labelledby={headingId}>
      <h3 className="application-progress__title" id={headingId}>
        {suspended
          ? en
            ? "Job posting suspended"
            : "Tin tuyển dụng đang bị tạm ngưng"
          : en
            ? "Status history"
            : "Lịch sử trạng thái"}
      </h3>
      {query.isFetching && !detail && (
        <div className="application-progress__loading">
          <p role="status" className="sr-only">
            {en ? "Loading progress…" : "Đang tải tiến trình…"}
          </p>
          <span className="application-progress__skeleton" aria-hidden="true" />
          <span className="application-progress__skeleton" aria-hidden="true" />
        </div>
      )}
      {(query.isError || Boolean(error)) && (
        <div className="application-progress__error" role="alert">
          <p>{message(query.error || error)}</p>
          <button
            type="button"
            className="application-progress__action"
            disabled={busy}
            onClick={() => {
              setError(undefined);
              void query.refetch();
            }}
          >
            <RotateCw size={15} aria-hidden="true" />
            {en ? "Reload status" : "Tải lại trạng thái"}
          </button>
        </div>
      )}
      {detail && !query.isError && !error && (
        <>
          {suspended ? (
            <p className="application-progress__notice">
              {en
                ? "Job posting, status history, feedback and CV information are unavailable while this posting is suspended."
                : "Thông tin tin tuyển dụng, lịch sử trạng thái, phản hồi và CV bị giới hạn trong thời gian tin tạm ngưng."}
            </p>
          ) : events.length > 0 ? (
            <ol className="application-progress__timeline">
              {events.map((event, index) => {
                const meta = statusMeta(event.toStatus);
                const latest = index === 0;
                return (
                  <li
                    key={`${event.occurredAt}:${index}`}
                    className="application-progress__event"
                    data-latest={latest || undefined}
                  >
                    <div className="application-progress__event-head">
                      <span className={`status-tag status-tag--${meta.tone}`}>
                        {en ? meta.en : meta.vi}
                      </span>
                      <time dateTime={event.occurredAt}>
                        {formatDate(event.occurredAt, en ? "en" : "vn")}
                        <span className="application-progress__clock">
                          {formatTime(event.occurredAt, en ? "en" : "vn")}
                        </span>
                      </time>
                    </div>
                    {event.candidateFeedback ? (
                      <p className="application-progress__feedback">{event.candidateFeedback}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="application-progress__empty">
              {en ? "No status history yet." : "Chưa có lịch sử trạng thái."}
            </p>
          )}

          {((!suspended && detail.canViewCv && detail.cvFileName) || active) && (
            <div className="application-progress__actions">
              {!suspended && detail.canViewCv && detail.cvFileName ? (
                <button
                  type="button"
                  className="application-progress__action"
                  disabled={busy || downloadingCv}
                  onClick={async () => {
                    if (downloadingCv) return;
                    setDownloadingCv(true);
                    setCvError(false);
                    try {
                      const result = await getCandidateApplicationCvDownloadUrl(id);
                      window.open(result.url, "_blank", "noopener,noreferrer");
                    } catch {
                      setCvError(true);
                    } finally {
                      setDownloadingCv(false);
                    }
                  }}
                >
                  {downloadingCv ? (
                    <Loader2 size={15} className="my-jobs-spinner" aria-hidden="true" />
                  ) : (
                    <Download size={15} aria-hidden="true" />
                  )}
                  {downloadingCv
                    ? en
                      ? "Creating link…"
                      : "Đang tạo liên kết…"
                    : en
                      ? "Download submitted CV"
                      : "Tải CV đã gửi"}
                </button>
              ) : null}
              {active && (
                <button
                  ref={withdrawTrigger}
                  type="button"
                  className="application-progress__action application-progress__action--withdraw"
                  disabled={query.isFetching || busy}
                  onClick={() => setConfirm(true)}
                >
                  <Undo2 size={15} aria-hidden="true" />
                  {en ? "Withdraw application" : "Rút đơn ứng tuyển"}
                </button>
              )}
            </div>
          )}
          {!suspended && cvError && (
            <p className="application-progress__notice" role="alert">
              {en ? "The submitted CV is no longer available." : "CV đã gửi không còn khả dụng."}
            </p>
          )}
        </>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!lock.current) setConfirm(open);
        }}
      >
        <DialogContent
          hideClose={busy}
          onCloseAutoFocus={(event) => {
            if (withdrawTrigger.current?.isConnected) {
              event.preventDefault();
              withdrawTrigger.current.focus();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>{en ? "Withdraw this application?" : "Rút đơn ứng tuyển?"}</DialogTitle>
          <DialogDescription>
            {en
              ? "This ends your participation. You cannot reopen or reapply to this posting. The company will lose access to your submitted contact details, cover letter and CV."
              : "Bạn sẽ kết thúc quy trình ứng tuyển và không thể mở lại hoặc ứng tuyển lại tin này. Doanh nghiệp sẽ không còn xem được thông tin liên hệ, thư ứng tuyển và CV đã gửi."}
          </DialogDescription>
          <div className="application-progress__dialog-actions">
            <button
              type="button"
              className="application-progress__dialog-action"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              {en ? "Keep application" : "Giữ đơn ứng tuyển"}
            </button>
            <button
              type="button"
              className="application-progress__dialog-action application-progress__dialog-action--confirm"
              disabled={busy || !active}
              onClick={async () => {
                if (lock.current || !detail) return;
                lock.current = true;
                setBusy(true);
                try {
                  const updated = await withdrawApplication(id, detail.version);
                  client.setQueryData(["candidate-application-detail", id], updated);
                  setConfirm(false);
                  await Promise.all(
                    [
                      "candidate-applications",
                      "candidate-application-counts",
                      "candidate-application-total",
                    ].map((key) => client.invalidateQueries({ queryKey: [key] })),
                  );
                } catch (reason) {
                  setError(reason);
                  setConfirm(false);
                } finally {
                  lock.current = false;
                  setBusy(false);
                }
              }}
            >
              {busy
                ? en
                  ? "Withdrawing…"
                  : "Đang rút đơn…"
                : en
                  ? "Confirm withdrawal"
                  : "Xác nhận rút đơn"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ApplicationCard({
  application,
  locale,
  focused = false,
}: {
  application: SubmittedApplication;
  locale: "vn" | "en";
  /** Opened by a notification deep link, which also brings the card into view. */
  focused?: boolean;
}) {
  const en = locale === "en";
  const [open, setOpen] = useState(focused);
  const cardRef = useRef<HTMLLIElement>(null);
  const statusRef = useRef<HTMLButtonElement>(null);
  const entered = useRef(false);
  const receiptId = `application-receipt-${useId()}`;
  const query = useQuery({
    queryKey: ["candidate-application-detail", application.id],
    queryFn: ({ signal }) => getCandidateApplication(application.id, signal),
    enabled: open,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: open ? 10_000 : false,
  });
  const detail = open ? query.data : undefined;
  // Open cards use fresh details; collapsed cards track the refreshed ledger.
  // A fresh detail response supersedes the ledger snapshot, including restoration.
  const suspended = detail?.jobSuspended ?? application.jobSuspended;
  const restricted = suspended || (open && (!detail || query.isError));

  // A notification deep link arrives with its application already expanded. The
  // card is revealed once, after the workspace has reset its own scroll, so the
  // status the notification is about is the first thing in view.
  useEffect(() => {
    if (!focused || entered.current) return;
    setOpen(true);
    const frame = window.requestAnimationFrame(() => {
      entered.current = true;
      const node = cardRef.current;
      if (!node) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      statusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focused]);

  const status = statusMeta(detail?.status ?? application.status);
  const statusLabel = en ? status.en : status.vi;
  const statusDetail = en ? status.enDetail : status.viDetail;
  const jobTitle = application.jobTitle || (en ? "Untitled job" : "Tin tuyển dụng chưa có tên");
  const companyName =
    application.companyName || (en ? "Unknown company" : "Doanh nghiệp chưa cập nhật");
  const cvFileName = application.cvFileName || (en ? "No attached CV" : "Chưa đính kèm hồ sơ");
  const appliedAt = formatDate(application.appliedAt, locale);
  const relativeAppliedAt = formatRelativeDate(application.appliedAt, locale);
  const deadline = application.deadline ? formatDate(application.deadline, locale) : "";
  const deadlinePassed = application.deadline ? hasDeadlinePassed(application.deadline) : false;
  const workMode = application.workMode
    ? workModeLabel(application.workMode, locale)
    : en
      ? "Not available"
      : "Chưa cập nhật";
  const location = application.location || (en ? "Not available" : "Chưa cập nhật");
  const deadlineLabel =
    deadline && !deadlinePassed
      ? `${en ? "Apply by" : "Hạn nộp"} ${deadline}`
      : deadlinePassed
        ? ""
        : en
          ? "No deadline"
          : "Chưa có hạn nộp";
  // Every declared data point keeps its place in the card; missing values are
  // shown as explicit placeholders rather than collapsing the row.
  const showMeta = true;

  const jobHref = !restricted && application.jobId > 0 ? { job: String(application.jobId) } : null;
  return (
    <li
      ref={cardRef}
      className={`application-card${deadlinePassed ? " application-card--expired" : ""}`}
      data-targeted={focused || undefined}
    >
      <div className="application-card__head">
        <span className="application-card__mark" aria-hidden="true">
          <Building2 size={48} className="default-company-avatar" aria-label="Company" />
        </span>

        <div className="application-card__identity">
          {jobHref ? (
            <h2 className="application-card__title">
              <Link to="/can/jobs" search={jobHref}>
                {jobTitle}
              </Link>
            </h2>
          ) : (
            <h2 className="application-card__title">{jobTitle}</h2>
          )}
          <p className="application-card__company">{companyName}</p>
          <ul className="application-card__meta">
            <li className={application.location ? "" : "application-card__meta-item--empty"}>
              <MapPin size={15} aria-hidden="true" />
              <span>{location}</span>
            </li>
            <li className={application.workMode ? "" : "application-card__meta-item--empty"}>
              <BriefcaseBusiness size={15} aria-hidden="true" />
              <span>{workMode}</span>
            </li>
            <li
              className={
                deadlineLabel === (en ? "No deadline" : "Chưa có hạn nộp")
                  ? "application-card__meta-item--empty"
                  : ""
              }
            >
              <CalendarClock size={15} aria-hidden="true" />
              <span>{deadlineLabel}</span>
            </li>
          </ul>
        </div>

        <div className="application-card__aside">
          <p className="application-card__applied">
            <span>{en ? "Applied" : "Ứng tuyển"}</span>{" "}
            <time dateTime={application.appliedAt}>{appliedAt}</time>
          </p>
          {deadlinePassed ? (
            <span className="status-tag status-tag--neutral application-card__expiry">
              {en ? "Posting closed" : "Hết hạn ứng tuyển"}
            </span>
          ) : null}
        </div>
      </div>

      <button
        ref={statusRef}
        type="button"
        className="application-card__status"
        aria-expanded={open}
        aria-controls={receiptId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`status-tag status-tag--${status.tone} application-card__status-tag`}>
          {statusLabel}
        </span>
        <span className="application-card__status-text">
          {suspended
            ? en
              ? "Job posting suspended"
              : "Tin tuyển dụng đang bị tạm ngưng"
            : statusDetail}
        </span>
        <ChevronDown
          size={18}
          className="application-card__chevron"
          data-open={open || undefined}
          aria-hidden="true"
        />
      </button>

      <div className="application-card__receipt" id={receiptId} hidden={!open}>
        <dl className="application-card__facts">
          <div>
            <dt>{en ? "Applied on" : "Ngày ứng tuyển"}</dt>
            <dd>
              <time dateTime={application.appliedAt}>{appliedAt}</time>
              {relativeAppliedAt ? (
                <span className="application-card__age">{relativeAppliedAt}</span>
              ) : null}
            </dd>
          </div>
          {!restricted && (
            <div>
              <dt>{en ? "CV sent" : "Hồ sơ đã gửi"}</dt>
              <dd className="application-card__cv">
                <FileText size={15} aria-hidden="true" />
                <span title={cvFileName}>{cvFileName}</span>
              </dd>
            </div>
          )}
        </dl>
        {jobHref ? (
          <Link
            to="/can/jobs"
            search={jobHref}
            className="application-card__open"
            aria-label={`${en ? "Open job posting" : "Xem tin tuyển dụng"}: ${jobTitle}`}
          >
            {en ? "Open job posting" : "Xem tin tuyển dụng"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
        {open && (
          <ApplicationProgress id={application.id} en={en} query={query} suspended={suspended} />
        )}
      </div>
    </li>
  );
}

function LoadingCards({ en }: { en: boolean }) {
  return (
    <div className="my-jobs-loading" role="status">
      <p>{en ? "Loading applications…" : "Đang tải danh sách đơn ứng tuyển…"}</p>
      {[0, 1, 2].map((row) => (
        <span className="my-jobs-skeleton" key={row} aria-hidden="true" />
      ))}
    </div>
  );
}

export function MyJobsView({ focusApplicationId }: { focusApplicationId?: string }) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const focusId = focusApplicationId?.trim() ?? "";
  /** Search or status filter already cleared for the current deep link. */
  const focusCleared = useRef<string | null>(null);
  /** Deep link already resolved to its ledger page. */
  const focusJumped = useRef<string | null>(null);

  const invalid = Array.from(input.trim()).length > MAX_SEARCH_LENGTH;
  const waiting = input.trim() !== search;

  // A deep link names one application, which the current search or status filter
  // could hide. Start from the complete ledger so the application can be found.
  useEffect(() => {
    if (!focusId || focusCleared.current === focusId) return;
    focusCleared.current = focusId;
    focusJumped.current = null;
    setInput("");
    setSearch("");
    setStatus("");
    setPage(0);
  }, [focusId]);

  useEffect(() => {
    if (invalid) return;
    if (input.trim() === search) return;
    const timer = window.setTimeout(() => {
      setSearch(input.trim());
      setPage(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [input, invalid, search]);

  const result = useQuery({
    queryKey: ["candidate-applications", search, status, page],
    queryFn: ({ signal }) => listApplicationPage({ search, status, page, size: PAGE_SIZE, signal }),
    enabled: !invalid && !waiting,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: "always",
    refetchInterval: 10_000,
  });

  const countsResult = useQuery({
    queryKey: ["candidate-application-counts", search],
    queryFn: ({ signal }) => listApplicationCounts({ search, signal }),
    enabled: !invalid && !waiting,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  // The collection tab states the whole collection, not the current search scope.
  const totalResult = useQuery({
    queryKey: ["candidate-application-total"],
    queryFn: ({ signal }) => listApplicationPage({ size: 1, signal }),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const data = result.data;
  const counts = countsResult.data;
  const statusCode = result.error instanceof ApiError ? result.error.status : 0;
  const hasFilters = Boolean(search || status);
  const totalElements = data?.totalElements ?? 0;

  // The linked application may sit on any ledger page. Only asked for when the
  // visible page does not already hold it, so an ordinary visit stays one request.
  const focusInPage =
    Boolean(focusId) && (data?.items.some((item) => item.id === focusId) ?? false);
  const locateResult = useQuery({
    queryKey: ["candidate-application-locate", focusId, PAGE_SIZE],
    queryFn: ({ signal }) => locateApplicationPage(focusId, { pageSize: PAGE_SIZE, signal }),
    enabled: Boolean(focusId) && !focusInPage,
    retry: false,
    staleTime: Infinity,
    gcTime: 60_000,
  });

  useEffect(() => {
    if (!focusId) return;
    if (focusInPage) {
      focusJumped.current = focusId;
      return;
    }
    if (focusJumped.current === focusId) return;
    const target = locateResult.data;
    if (!target) return;
    // Resolved once: turning pages afterwards stays the candidate's choice.
    focusJumped.current = focusId;
    if (target.page !== page) setPage(target.page);
  }, [focusId, focusInPage, locateResult.data, page]);

  const focusMissing =
    Boolean(focusId) &&
    !focusInPage &&
    data !== undefined &&
    !locateResult.isFetching &&
    locateResult.data === null;

  const errorMessage = useMemo(() => {
    if (!result.isError) return "";
    if (statusCode === 401)
      return en
        ? "Your session has expired. Please sign in again."
        : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (statusCode === 403)
      return en
        ? "You do not have permission to view these applications."
        : "Bạn không có quyền xem danh sách đơn ứng tuyển này.";
    if (statusCode === 400)
      return en
        ? "The search or filter is invalid. Check it and try again."
        : "Từ khóa hoặc bộ lọc không hợp lệ. Vui lòng kiểm tra và thử lại.";
    return en
      ? "We could not load your applications. Please try again."
      : "Không tải được danh sách đơn ứng tuyển. Vui lòng thử lại.";
  }, [result.isError, statusCode, en]);

  const clearFilters = () => {
    setInput("");
    setSearch("");
    setStatus("");
    setPage(0);
  };

  const appliedTabLabel = en ? "Applied" : "Đã ứng tuyển";
  const appliedTabCount = totalResult.data?.totalElements;

  return (
    <div className="workspace-page candidate-my-jobs">
      <header className="workspace-heading">
        <div>
          <h1>{en ? "My jobs" : "Công việc của tôi"}</h1>
          <p>
            {en
              ? "Track every application you have sent and the current status of each one."
              : "Theo dõi các công việc bạn đã ứng tuyển và trạng thái xử lý của từng đơn."}
          </p>
        </div>
        <div>
          <Link to="/can/jobs" className="workspace-header-action">
            <BriefcaseBusiness size={17} aria-hidden="true" />
            {en ? "Find jobs" : "Tìm việc làm"}
          </Link>
        </div>
      </header>

      <nav className="my-jobs-tabs" aria-label={en ? "Job collections" : "Nhóm việc làm"}>
        <Link
          to="/can/applied"
          className="my-jobs-tab"
          aria-current="page"
          aria-label={
            appliedTabCount === undefined
              ? appliedTabLabel
              : `${appliedTabLabel} (${appliedTabCount})`
          }
        >
          <span>{appliedTabLabel}</span>
        </Link>
        <button
          type="button"
          className="my-jobs-tab"
          disabled
          aria-disabled="true"
          aria-label={en ? "Saved (coming soon)" : "Đã lưu (sắp ra mắt)"}
          title={en ? "Coming soon" : "Sắp ra mắt"}
        >
          <span>{en ? "Saved" : "Đã lưu"}</span>
        </button>
        <button
          type="button"
          className="my-jobs-tab"
          disabled
          aria-disabled="true"
          aria-label={en ? "Recently viewed (coming soon)" : "Đã xem gần đây (sắp ra mắt)"}
          title={en ? "Coming soon" : "Sắp ra mắt"}
        >
          <span>{en ? "Recently viewed" : "Đã xem gần đây"}</span>
        </button>
      </nav>

      <section aria-labelledby="my-jobs-list-title">
        <h2 id="my-jobs-list-title" className="sr-only">
          {en ? "Application list" : "Danh sách đơn ứng tuyển"}
        </h2>

        <div className="my-jobs-toolbar">
          <div className="my-jobs-filters">
            <label htmlFor="my-jobs-status-filter" className="sr-only">
              {en ? "Filter by status" : "Lọc theo trạng thái"}
            </label>
            <div className="my-jobs-status-select">
              <select
                id="my-jobs-status-filter"
                className="my-jobs-status-select__input"
                value={status}
                aria-label={en ? "Filter by status" : "Lọc theo trạng thái"}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
              >
                {STATUS_FILTERS.map((filter) => {
                  const label = en ? filter.en : filter.vi;
                  const count = counts?.[STATUS_COUNT_KEYS[filter.value]];
                  return (
                    <option key={filter.value || "all"} value={filter.value}>
                      {label} ({count ?? "–"})
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
          </div>

          <div className="my-jobs-search">
            <div className="my-jobs-search__field">
              <SearchIcon size={18} aria-hidden="true" />
              <label htmlFor="my-jobs-search" className="sr-only">
                {en ? "Search by job or company" : "Tìm theo tên công việc hoặc công ty"}
              </label>
              <input
                id="my-jobs-search"
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={en ? "Search job or company…" : "Tìm tên công việc hoặc công ty…"}
                aria-invalid={invalid || undefined}
                aria-describedby="my-jobs-search-help"
              />
            </div>
            <p id="my-jobs-search-help" className="sr-only">
              {en
                ? "Search ignores case and Vietnamese accents. Up to 150 characters."
                : "Tìm kiếm không phân biệt chữ hoa, chữ thường và dấu. Tối đa 150 ký tự."}
            </p>
            {invalid && (
              <p className="my-jobs-search__error" role="alert">
                {en
                  ? "The search term is too long. Use at most 150 characters."
                  : "Từ khóa quá dài. Vui lòng nhập tối đa 150 ký tự."}
              </p>
            )}
          </div>
        </div>

        <div className="my-jobs-list-meta">
          <p className="my-jobs-count" role="status" aria-live="polite">
            {result.isFetching && !waiting ? (
              <Loader2 size={14} className="my-jobs-spinner" aria-hidden="true" />
            ) : null}
            {data ? (en ? `${totalElements} applications` : `${totalElements} đơn`) : ""}
          </p>
          <p className="my-jobs-order">
            <ArrowDownWideNarrow size={15} aria-hidden="true" />
            {en ? "Newest application first" : "Đơn nộp mới nhất trước"}
          </p>
        </div>

        {focusMissing && (
          <p className="my-jobs-focus-note" role="status">
            {en
              ? "The application from that notification is not in your list. Every other application is shown below."
              : "Không tìm thấy đơn ứng tuyển từ thông báo. Các đơn còn lại vẫn được hiển thị bên dưới."}
          </p>
        )}

        {result.isError && !waiting && !invalid ? (
          <div className="my-jobs-state" role="alert">
            <span className="my-jobs-state__icon is-error" aria-hidden="true">
              <ShieldAlert size={22} />
            </span>
            <h2>{en ? "Applications are unavailable" : "Chưa tải được đơn ứng tuyển"}</h2>
            <p>{errorMessage}</p>
            {statusCode === 401 ? (
              <Link to="/login" className="my-jobs-state__cta">
                {en ? "Sign in" : "Đăng nhập"}
              </Link>
            ) : (
              <button
                type="button"
                className="my-jobs-state__cta"
                onClick={() => void result.refetch()}
              >
                {en ? "Try again" : "Thử lại"}
              </button>
            )}
          </div>
        ) : !data && (waiting || result.isFetching) ? (
          <LoadingCards en={en} />
        ) : data && data.items.length === 0 ? (
          <div className="my-jobs-state">
            <span className="my-jobs-state__icon" aria-hidden="true">
              {hasFilters ? <SearchX size={22} /> : <ApplicationIcon size={22} />}
            </span>
            <h2>
              {hasFilters
                ? en
                  ? "No applications match your filters"
                  : "Không có đơn ứng tuyển phù hợp"
                : en
                  ? "You have not applied to any jobs yet"
                  : "Bạn chưa ứng tuyển công việc nào"}
            </h2>
            <p>
              {hasFilters
                ? en
                  ? "Try another keyword or clear the status filter to see all applications."
                  : "Thử từ khóa khác hoặc bỏ bộ lọc trạng thái để xem toàn bộ đơn ứng tuyển."
                : en
                  ? "When you submit a CV, the job and its processing status will appear here."
                  : "Khi bạn nộp hồ sơ, công việc và trạng thái xử lý sẽ xuất hiện tại đây."}
            </p>
            {hasFilters ? (
              <button type="button" className="my-jobs-state__cta" onClick={clearFilters}>
                {en ? "Clear filters" : "Xóa bộ lọc"}
              </button>
            ) : (
              <Link to="/can/jobs" className="my-jobs-state__cta">
                {en ? "Find jobs" : "Tìm việc làm"}
              </Link>
            )}
          </div>
        ) : data ? (
          <>
            <ul className="application-card-list" aria-busy={result.isFetching}>
              {data.items.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  locale={locale}
                  focused={Boolean(focusId) && application.id === focusId}
                />
              ))}
            </ul>
            {data.totalPages > 1 && (
              <AdminPagination
                totalItems={data.totalElements}
                page={data.pageNumber}
                pageSize={data.pageSize}
                itemLabel={en ? "applications" : "đơn ứng tuyển"}
                label={en ? "Application list pages" : "Phân trang đơn ứng tuyển"}
                onPageChange={setPage}
                standalone
              />
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}
