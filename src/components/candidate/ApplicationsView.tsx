import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Loader2,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ApplicationIcon, SearchIcon } from "@/components/icons";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/services/api";
import {
  listApplicationCounts,
  listApplicationPage,
  type SubmittedApplication,
} from "@/services/candidateApplications";
import "./applications.css";

const PAGE_SIZE = 10;
const MAX_SEARCH_LENGTH = 150;

type StatusTone = "info" | "success" | "warning" | "danger" | "neutral";

const STATUS_META: Record<
  string,
  { vi: string; en: string; tone: StatusTone; description: string }
> = {
  SUBMITTED: {
    vi: "Đã nộp",
    en: "Submitted",
    tone: "info",
    description: "Hồ sơ đã được gửi tới nhà tuyển dụng và đang chờ phản hồi.",
  },
  VIEWED: {
    vi: "Đã xem",
    en: "Viewed",
    tone: "warning",
    description: "Nhà tuyển dụng đã mở hồ sơ ứng tuyển của bạn.",
  },
  UNDER_REVIEW: {
    vi: "Đang xem xét",
    en: "Under review",
    tone: "warning",
    description: "Nhà tuyển dụng đang xem xét hồ sơ ứng tuyển của bạn.",
  },
  SHORTLISTED: {
    vi: "Vào vòng trong",
    en: "Shortlisted",
    tone: "success",
    description: "Hồ sơ của bạn đã được đưa vào danh sách xem xét tiếp theo.",
  },
  REJECTED: {
    vi: "Từ chối",
    en: "Rejected",
    tone: "danger",
    description: "Nhà tuyển dụng đã từ chối hồ sơ ứng tuyển này.",
  },
  WITHDRAWN: {
    vi: "Đã rút",
    en: "Withdrawn",
    tone: "neutral",
    description: "Đơn ứng tuyển đã được rút khỏi quy trình tuyển dụng.",
  },
};

const STATUS_FILTERS = [
  { value: "", vi: "Tất cả", en: "All" },
  { value: "SUBMITTED", vi: "Đã nộp", en: "Submitted" },
  { value: "VIEWED", vi: "Đã xem", en: "Viewed" },
  { value: "REJECTED", vi: "Từ chối", en: "Rejected" },
] as const;

const STATUS_COUNT_KEYS = {
  "": "all",
  SUBMITTED: "submitted",
  VIEWED: "viewed",
  REJECTED: "rejected",
} as const;

const COMPANY_PREFIXES = new Set([
  "công",
  "cong",
  "ty",
  "tnhh",
  "cp",
  "cổ",
  "co",
  "phần",
  "phan",
  "tập",
  "tap",
  "đoàn",
  "doan",
  "trách",
  "trach",
  "nhiệm",
  "nhiem",
  "hữu",
  "huu",
  "hạn",
  "han",
  "chi",
  "nhánh",
  "nhanh",
  "việt",
  "viet",
  "nam",
  "và",
  "va",
]);

function companyInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !COMPANY_PREFIXES.has(word.toLocaleLowerCase("vi")));
  const source = words.length ? words : name.trim().split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("vi");
}

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? { vi: status, en: status, tone: "neutral" as const, description: "" }
  );
}

function formatAppliedAt(value: string, locale: "vn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatRelativeAppliedAt(value: string, locale: "vn" | "en") {
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

function ApplicationRow({
  application,
  locale,
}: {
  application: SubmittedApplication;
  locale: "vn" | "en";
}) {
  const en = locale === "en";
  const status = statusMeta(application.status);
  const statusLabel = en ? status.en : status.vi;
  const jobTitle = application.jobTitle || (en ? "Untitled job" : "Tin tuyển dụng chưa có tên");
  const companyName =
    application.companyName || (en ? "Unknown company" : "Doanh nghiệp chưa cập nhật");
  const cvFileName = application.cvFileName || (en ? "No attached CV" : "Chưa đính kèm hồ sơ");
  const appliedAt = formatAppliedAt(application.appliedAt, locale);
  const relativeAppliedAt = formatRelativeAppliedAt(application.appliedAt, locale);

  return (
    <li className="application-ledger__item">
      <span className="application-ledger__mark" aria-hidden="true">
        {companyInitials(companyName)}
      </span>

      <div className="application-ledger__body">
        {application.jobId > 0 ? (
          <Link
            to="/can/jobs"
            search={{ job: String(application.jobId) }}
            className="application-ledger__title"
          >
            {jobTitle}
          </Link>
        ) : (
          <h3 className="application-ledger__title">{jobTitle}</h3>
        )}
        <p className="application-ledger__company">{companyName}</p>
      </div>

      <div className="application-ledger__date">
        <span className="sr-only">{en ? "Applied on" : "Ngày ứng tuyển"}: </span>
        <time dateTime={application.appliedAt}>{appliedAt}</time>
        {relativeAppliedAt ? (
          <span className="application-ledger__relative" aria-hidden="true">
            {relativeAppliedAt}
          </span>
        ) : null}
      </div>

      <div className="application-ledger__cv">
        <FileText size={15} aria-hidden="true" />
        <span className="sr-only">{en ? "Attached CV" : "Hồ sơ đã đính kèm"}: </span>
        <span title={cvFileName}>{cvFileName}</span>
      </div>

      <span
        className={`status-tag status-tag--${status.tone} application-ledger__status`}
        title={status.description || undefined}
      >
        {statusLabel}
      </span>

      <div className="application-ledger__tail">
        {application.jobId > 0 && (
          <Link
            to="/can/jobs"
            search={{ job: String(application.jobId) }}
            className="application-ledger__action"
            aria-label={`${en ? "Open job" : "Xem tin"}: ${jobTitle}`}
          >
            {en ? "Open job" : "Xem tin"}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  );
}

function LoadingRows() {
  return (
    <div className="application-ledger__loading" role="status">
      <p>Đang tải danh sách đơn ứng tuyển…</p>
      {[0, 1, 2].map((row) => (
        <span className="application-ledger__skeleton" key={row} aria-hidden="true" />
      ))}
    </div>
  );
}

export function ApplicationsView() {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const invalid = Array.from(input.trim()).length > MAX_SEARCH_LENGTH;
  const waiting = input.trim() !== search;

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

  const data = result.data;
  const counts = countsResult.data;
  const statusCode = result.error instanceof ApiError ? result.error.status : 0;
  const hasFilters = Boolean(search || status);
  const totalElements = data?.totalElements ?? 0;

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

  return (
    <div className="workspace-page candidate-applications">
      <header className="workspace-heading">
        <div>
          <h1>{en ? "Jobs you have applied to" : "Công việc đã ứng tuyển"}</h1>
          <p>
            {en
              ? "Track every application you have sent and the current status of each one."
              : "Theo dõi toàn bộ hồ sơ bạn đã nộp và trạng thái xử lý hiện tại của từng đơn."}
          </p>
        </div>
        <div>
          <Link to="/can/jobs" className="workspace-header-action">
            <BriefcaseBusiness size={17} aria-hidden="true" />
            {en ? "Find jobs" : "Tìm việc làm"}
          </Link>
        </div>
      </header>

      <section className="application-ledger" aria-labelledby="application-ledger-title">
        <h2 id="application-ledger-title" className="sr-only">
          {en ? "Application list" : "Danh sách đơn ứng tuyển"}
        </h2>

        <div className="application-ledger__toolbar">
          <div
            className="application-ledger__tabs"
            role="group"
            aria-label={en ? "Filter by status" : "Lọc theo trạng thái"}
          >
            {STATUS_FILTERS.map((filter) => {
              const label = en ? filter.en : filter.vi;
              const count = counts?.[STATUS_COUNT_KEYS[filter.value]];
              return (
                <button
                  key={filter.value || "all"}
                  type="button"
                  className="application-ledger__tab"
                  aria-pressed={status === filter.value}
                  aria-label={count === undefined ? label : `${label} (${count})`}
                  onClick={() => {
                    setStatus(filter.value);
                    setPage(0);
                  }}
                >
                  <span>{label}</span>
                  <span className="application-ledger__tab-count" aria-hidden="true">
                    {count ?? "–"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="application-ledger__search">
            <div className="application-ledger__search-field">
              <SearchIcon size={18} aria-hidden="true" />
              <label htmlFor="application-search" className="sr-only">
                {en ? "Search by job or company" : "Tìm theo tên công việc hoặc công ty"}
              </label>
              <input
                id="application-search"
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={en ? "Search job or company…" : "Tìm tên công việc hoặc công ty…"}
                aria-invalid={invalid || undefined}
                aria-describedby="application-search-help"
              />
            </div>
            <p id="application-search-help" className="sr-only">
              {en
                ? "Search ignores case and Vietnamese accents. Up to 150 characters."
                : "Tìm kiếm không phân biệt chữ hoa, chữ thường và dấu. Tối đa 150 ký tự."}
            </p>
            {invalid && (
              <p className="application-ledger__error" role="alert">
                {en
                  ? "The search term is too long. Use at most 150 characters."
                  : "Từ khóa quá dài. Vui lòng nhập tối đa 150 ký tự."}
              </p>
            )}
          </div>
        </div>

        <div className="application-ledger__utility">
          <p className="application-ledger__order">
            <ArrowDownWideNarrow size={15} aria-hidden="true" />
            {en ? "Newest application first" : "Đơn nộp mới nhất trước"}
          </p>
          <p className="application-ledger__count" role="status" aria-live="polite">
            {result.isFetching && !waiting ? (
              <Loader2 size={14} className="application-ledger__spinner" aria-hidden="true" />
            ) : null}
            {data ? (en ? `${totalElements} applications` : `${totalElements} đơn`) : ""}
          </p>
        </div>

        {result.isError && !waiting && !invalid ? (
          <div className="application-ledger__state" role="alert">
            <span className="application-ledger__state-icon is-error" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <h2>{en ? "Applications are unavailable" : "Chưa tải được đơn ứng tuyển"}</h2>
            <p>{errorMessage}</p>
            {statusCode === 401 ? (
              <Link to="/login" className="application-ledger__cta">
                {en ? "Sign in" : "Đăng nhập"}
              </Link>
            ) : (
              <button
                type="button"
                className="application-ledger__cta"
                onClick={() => void result.refetch()}
              >
                {en ? "Try again" : "Thử lại"}
              </button>
            )}
          </div>
        ) : !data && (waiting || result.isFetching) ? (
          <LoadingRows />
        ) : data && data.items.length === 0 ? (
          <div className="application-ledger__state">
            <span className="application-ledger__state-icon" aria-hidden="true">
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
              <button type="button" className="application-ledger__cta" onClick={clearFilters}>
                {en ? "Clear filters" : "Xóa bộ lọc"}
              </button>
            ) : (
              <Link to="/can/jobs" className="application-ledger__cta">
                {en ? "Find jobs" : "Tìm việc làm"}
              </Link>
            )}
          </div>
        ) : data ? (
          <>
            <div className="application-ledger__columns" aria-hidden="true">
              <span>{en ? "Job" : "Công việc"}</span>
              <span>{en ? "Applied" : "Ngày ứng tuyển"}</span>
              <span>{en ? "CV sent" : "Hồ sơ đã gửi"}</span>
              <span>{en ? "Status" : "Trạng thái"}</span>
            </div>
            <ul className="application-ledger__list" aria-busy={result.isFetching}>
              {data.items.map((application) => (
                <ApplicationRow key={application.id} application={application} locale={locale} />
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
