import { companyVerificationPresentation } from "@/lib/company-verification-presentation";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BadgeX,
  Check,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileX2,
  LockKeyhole,
  UnlockKeyhole,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StaffStatusBadge, type StaffStatusTone } from "@/components/admin/StaffStatusBadge";
import { ApiError } from "@/services/api";
import { useTableSort } from "@/hooks/useTableSort";
import { sortDate } from "@/lib/table-sort";
import { SortableHeader } from "@/components/admin/SortableHeader";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_CATEGORIES,
  ACTIVITY_TARGETS,
  ACTIONS_BY_CATEGORY,
  TARGETS_BY_CATEGORY,
  listStaffActivities,
  validateActivityFilters,
  type ActivityCategory,
  type ActivityFilters,
  type StaffActivity,
  type StaffActivityPage,
} from "@/services/staffActivities";
import { ReportActivityHistory } from "@/components/admin/ReportActivityHistory";
import "@/components/admin/audit-logs.css";

export const Route = createFileRoute("/staff/audit-logs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Lịch sử hoạt động của tôi — Platform staff GuardianWork" },
    ],
  }),
  component: ActivityHistoryPage,
});

const missing = "Không có dữ liệu";
const vietnamTime = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const vietnamDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function initialDates(): Pick<ActivityFilters, "fromDate" | "toDate"> {
  const parts = Object.fromEntries(
    vietnamDate.formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  const toDate = `${parts.year}-${parts.month}-${parts.day}`;
  const start = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) - 29),
  );
  const fromDate = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
  return { fromDate, toDate };
}
const initialFilters = (): ActivityFilters => ({
  ...initialDates(),
  category: "",
  action: "",
  targetType: "",
  targetId: "",
});
const stateLabels: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Không hoạt động",
  SUSPENDED: "Đang bị đình chỉ",
  REGISTERED: "Chưa gửi xác minh",
  DELETED: "Đã xóa",
  BANNED: "Đã khóa",
  PENDING: "Chờ xác minh",
  VERIFIED: "Đã xác minh",
  REJECTED: "Đã từ chối",
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ xét duyệt",
  APPROVED: "Đã duyệt",
  WITHDRAWN: "Đã rút yêu cầu duyệt",
  PUBLISHED: "Đang tuyển",
  PAUSED: "Đã tạm dừng tuyển",
  CLOSED: "Đã đóng tin",
  EXPIRED: "Đã hết hạn",
  DEACTIVATED: "Đã vô hiệu hóa",
  DELETION_PENDING: "Đang chờ xóa",
  true: "Đã khóa",
  false: "Không bị khóa",
};
const tones: Record<string, StaffStatusTone> = {
  ACTIVE: "verified",
  VERIFIED: "verified",
  APPROVED: "verified",
  false: "verified",
  BANNED: "rejected",
  REJECTED: "rejected",
  true: "rejected",
  PENDING: "pending",
  PENDING_REVIEW: "pending",
  SUSPENDED: "pending",
  DRAFT: "neutral",
  DELETED: "neutral",
  WITHDRAWN: "neutral",
};
const actionTones: Record<keyof typeof ACTIVITY_ACTIONS, StaffStatusTone> = {
  BAN_ACCOUNT: "purple",
  UNBAN_ACCOUNT: "teal",
  APPROVE_JOB_REVISION: "verified",
  REJECT_JOB_REVISION: "rejected",
  APPROVE_COMPANY: "verified",
  REJECT_COMPANY: "rejected",
  REVIEW_COMPANY: "info",
};
const actionIcons = {
  BAN_ACCOUNT: LockKeyhole,
  UNBAN_ACCOUNT: UnlockKeyhole,
  APPROVE_JOB_REVISION: FileCheck2,
  REJECT_JOB_REVISION: FileX2,
  APPROVE_COMPANY: BadgeCheck,
  REJECT_COMPANY: BadgeX,
  REVIEW_COMPANY: ClipboardCheck,
};
function state(
  value: string | boolean | null | undefined,
  previous = false,
  category?: ActivityCategory,
) {
  if (value == null)
    return (
      <span className="activity-missing" aria-label={missing}>
        —
      </span>
    );
  const key = String(value);
  const verification =
    category === "COMPANY_VERIFICATION" ? companyVerificationPresentation(key) : null;
  const tone = verification?.tone ?? tones[key] ?? "neutral";
  const label = verification?.label ?? stateLabels[key] ?? "Chưa rõ trạng thái";
  if (previous)
    return (
      <StaffStatusBadge tone={tone} className="activity-previous-tag">
        {label}
      </StaffStatusBadge>
    );
  const Icon =
    key === "BANNED" || key === "true"
      ? LockKeyhole
      : tone === "rejected"
        ? X
        : tone === "verified"
          ? Check
          : tone === "pending"
            ? Clock3
            : null;
  return (
    <StaffStatusBadge tone={tone} className="activity-result-tag">
      {Icon && <Icon size={13} aria-hidden="true" />}
      {label}
    </StaffStatusBadge>
  );
}
function formatTime(value: string | null | undefined) {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? missing : vietnamTime.format(date);
}
function ActivityHistoryPage() {
  const [source, setSource] = useState<"system" | "reports">("system");
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<StaffActivityPage | null>(null);
  const tableSort = useTableSort(
    result?.content ?? [],
    {
      occurredAt: (row) => sortDate(row.occurredAt),
      action: (row) => ACTIVITY_ACTIONS[row.action],
      target: (row) =>
        `${row.targetType ? ACTIVITY_TARGETS[row.targetType] : ""} ${row.targetId ?? ""}`,
      state: (row) =>
        row.changes
          ?.map((change) =>
            row.category === "COMPANY_VERIFICATION"
              ? `${change.before == null ? "" : companyVerificationPresentation(String(change.before)).label} ${change.after == null ? "" : companyVerificationPresentation(String(change.after)).label}`
              : `${stateLabels[String(change.before)] ?? ""} ${stateLabels[String(change.after)] ?? ""}`,
          )
          .join("; "),
      reason: (row) => row.reason,
    },
    { key: "occurredAt", direction: "desc" },
    JSON.stringify(filters),
  );
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const validation = validateActivityFilters(filters);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError(null);
    if (source !== "system" || validation) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    listStaffActivities(filters, page, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          setLoading(false);
        }
      },
      (cause) => {
        if (controller.signal.aborted) return;
        const status = cause instanceof ApiError ? cause.status : 0;
        const message =
          status === 400
            ? "Bộ lọc chưa hợp lệ. Kiểm tra thông tin đã nhập rồi thử lại."
            : status === 401
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : status === 403
                ? "Bạn không có quyền xem lịch sử hoạt động này."
                : status === 503
                  ? "Dịch vụ lịch sử tạm thời gián đoạn. Vui lòng thử lại."
                  : "Không thể tải lịch sử hoạt động. Vui lòng thử lại.";
        setError({ status, message });
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [filters, page, retry, validation, source]);
  function change(patch: Partial<ActivityFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }
  function changeCategory(category: ActivityCategory | "") {
    change({ category, action: "", targetType: "", targetId: "" });
  }
  function changeAction(action: ActivityFilters["action"]) {
    change({
      action,
      targetType:
        filters.targetType &&
        filters.category &&
        TARGETS_BY_CATEGORY[filters.category].includes(filters.targetType)
          ? filters.targetType
          : "",
      targetId: filters.targetType ? filters.targetId : "",
    });
  }
  function target(activity: StaffActivity) {
    return (
      <>
        {activity.targetType ? ACTIVITY_TARGETS[activity.targetType] : missing}
        <small>
          {activity.targetId == null ? missing : `#${activity.targetId}`}
          {activity.targetType === "JOB_POSTING" && (
            <> · Phiên bản {activity.revisionId == null ? missing : `#${activity.revisionId}`}</>
          )}
        </small>
      </>
    );
  }
  const showPagination = result && (result.totalPages > 1 || page > 0);
  return (
    <AdminShell title="Lịch sử hoạt động của tôi" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Lịch sử hoạt động của tôi</h1>
          <p>Xem lại các thao tác bạn đã thực hiện · Giờ Việt Nam (UTC+7)</p>
        </div>
      </div>
      <div className="staff-activity-sources" role="group" aria-label="Nguồn hoạt động">
        <button
          type="button"
          aria-pressed={source === "system"}
          onClick={() => setSource("system")}
        >
          Hoạt động hệ thống
        </button>
        <button
          type="button"
          aria-pressed={source === "reports"}
          onClick={() => setSource("reports")}
        >
          Báo cáo vi phạm · Trình duyệt
        </button>
      </div>
      {source === "reports" ? (
        <ReportActivityHistory />
      ) : (
        <section className="admin-panel audit-panel" aria-labelledby="activity-list-title">
          <div className="admin-panel-heading">
            <div>
              <h2 id="activity-list-title">Hoạt động đã ghi nhận</h2>
              <p>
                {tableSort.sort.key === "occurredAt" && tableSort.sort.direction === "desc"
                  ? "Mới nhất trước"
                  : "Sắp xếp trong trang hiện tại"}{" "}
                · 20 bản ghi mỗi trang
              </p>
            </div>
          </div>
          <div className="admin-sample-toolbar audit-toolbar">
            <div className="audit-filters">
              <label className="admin-sample-filter">
                Từ ngày
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => change({ fromDate: e.target.value })}
                  aria-invalid={Boolean(validation) || undefined}
                  aria-describedby={validation ? "activity-filter-error" : undefined}
                />
              </label>
              <label className="admin-sample-filter">
                Đến ngày
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => change({ toDate: e.target.value })}
                  aria-invalid={Boolean(validation) || undefined}
                  aria-describedby={validation ? "activity-filter-error" : undefined}
                />
              </label>
              <label className="admin-sample-filter">
                Nhóm hoạt động
                <select
                  value={filters.category}
                  onChange={(e) => changeCategory(e.target.value as ActivityCategory | "")}
                >
                  <option value="">Tất cả nhóm</option>
                  {Object.entries(ACTIVITY_CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-sample-filter">
                Hành động
                <select
                  value={filters.action}
                  disabled={!filters.category}
                  onChange={(e) => changeAction(e.target.value as ActivityFilters["action"])}
                >
                  <option value="">Tất cả hành động</option>
                  {filters.category &&
                    ACTIONS_BY_CATEGORY[filters.category].map((value) => (
                      <option key={value} value={value}>
                        {ACTIVITY_ACTIONS[value]}
                      </option>
                    ))}
                </select>
              </label>
              <label className="admin-sample-filter">
                Loại đối tượng
                <select
                  value={filters.targetType}
                  disabled={!filters.category}
                  onChange={(e) =>
                    change({
                      targetType: e.target.value as ActivityFilters["targetType"],
                      targetId: "",
                    })
                  }
                >
                  <option value="">Tất cả loại</option>
                  {filters.category &&
                    TARGETS_BY_CATEGORY[filters.category].map((value) => (
                      <option key={value} value={value}>
                        {ACTIVITY_TARGETS[value]}
                      </option>
                    ))}
                </select>
              </label>
              <label className="admin-sample-filter">
                Mã đối tượng
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={filters.targetId}
                  disabled={!filters.targetType}
                  onChange={(e) => change({ targetId: e.target.value })}
                  placeholder="Ví dụ: 123"
                  aria-invalid={Boolean(filters.targetId && validation) || undefined}
                  aria-describedby={validation ? "activity-filter-error" : undefined}
                />
              </label>
              <button
                type="button"
                className="admin-text-link"
                onClick={() => {
                  setFilters(initialFilters());
                  setPage(0);
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
            {validation && (
              <p id="activity-filter-error" className="audit-date-error" role="alert">
                {validation}
              </p>
            )}
          </div>
          {!validation && error && (
            <div className="activity-feedback activity-error" role="alert">
              <p>{error.message}</p>
              {error.status !== 403 && error.status !== 401 && (
                <button
                  type="button"
                  className="admin-secondary-action"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Thử lại
                </button>
              )}
            </div>
          )}
          {!validation && !error && loading && (
            <div className="activity-feedback" role="status">
              Đang tải lịch sử hoạt động…
            </div>
          )}
          {!validation &&
            !error &&
            !loading &&
            result &&
            (result.content.length ? (
              <div
                className="admin-table-scroll"
                role="region"
                aria-label="Bảng lịch sử hoạt động của tôi"
                tabIndex={0}
              >
                <table className="admin-record-table audit-table activity-table">
                  <caption className="sr-only">Lịch sử hoạt động cá nhân</caption>
                  <thead>
                    <tr>
                      <SortableHeader label="Thời điểm" column="occurredAt" {...tableSort} />
                      <SortableHeader label="Hành động" column="action" {...tableSort} />
                      <SortableHeader label="Loại / mã đối tượng" column="target" {...tableSort} />
                      <SortableHeader label="Thay đổi trạng thái" column="state" {...tableSort} />
                      <SortableHeader label="Lý do ghi nhận" column="reason" {...tableSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {tableSort.rows.map((item) => {
                      const ActionIcon = actionIcons[item.action] ?? ClipboardCheck;
                      return (
                        <tr key={item.id}>
                          <td>
                            <time dateTime={item.occurredAt}>{formatTime(item.occurredAt)}</time>
                          </td>
                          <td>
                            <StaffStatusBadge
                              tone={actionTones[item.action] ?? "neutral"}
                              className="activity-action"
                            >
                              <ActionIcon size={17} aria-hidden="true" />
                              <span>
                                {ACTIVITY_ACTIONS[item.action] ?? "Thao tác chưa xác định"}
                              </span>
                            </StaffStatusBadge>
                          </td>
                          <td>{target(item)}</td>
                          <td>
                            {(item.changes?.length
                              ? item.changes
                              : [{ field: "status", before: null, after: null }]
                            ).map((change, index) => (
                              <div className="activity-transition" key={`${change.field}-${index}`}>
                                <span className="sr-only">Trạng thái trước: </span>
                                {state(change.before, true, item.category)}
                                <span className="activity-result">
                                  <ArrowRight size={14} aria-hidden="true" />
                                  <span className="sr-only">Trạng thái sau: </span>
                                  {state(change.after, false, item.category)}
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="activity-reason">
                            {item.reason ?? <span className="activity-missing">{missing}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="activity-feedback" role="status">
                <strong>Không có hoạt động phù hợp</strong>
                {result.totalElements > 0 && (
                  <p>Trang này nằm ngoài phạm vi kết quả. Chọn trang trước để tiếp tục.</p>
                )}
              </div>
            ))}
          {!validation && !error && !loading && showPagination && (
            <nav className="activity-pagination" aria-label="Phân trang lịch sử hoạt động">
              <span>
                {result.totalElements.toLocaleString("vi-VN")} hoạt động · Trang {page + 1}
                {result.totalPages ? ` / ${result.totalPages}` : ""}
              </span>
              <div>
                <button
                  type="button"
                  disabled={result.first}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={result.last}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Trang sau
                </button>
              </div>
            </nav>
          )}
        </section>
      )}
    </AdminShell>
  );
}
