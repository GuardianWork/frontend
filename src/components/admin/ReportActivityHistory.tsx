import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, History } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ListSearch } from "@/components/ListSearch";
import {
  loadReportWorkspace,
  REPORT_ACTIONS,
  REPORT_ACTIVITY_EVENT,
  type ReportActivity,
} from "@/services/staffReportsLocal";
import { useTableSort } from "@/hooks/useTableSort";
import { sortDate } from "@/lib/table-sort";
import { useListPagination } from "@/hooks/useListPagination";
import { AdminPagination } from "./AdminPagination";
import { SortableHeader } from "./SortableHeader";
import { StaffStatusBadge } from "./StaffStatusBadge";
import "./report-activity.css";

function value(state: ReportActivity["before"]) {
  if (state === null)
    return (
      <span className="activity-missing" aria-label="Chưa gắn nhãn xử lý">
        —
      </span>
    );
  if (typeof state === "boolean") return <span>{state ? "Đã đọc" : "Chưa đọc"}</span>;
  return (
    <StaffStatusBadge tone={state === "Đang xem xét" ? "pending" : "verified"} icon>
      {state}
    </StaffStatusBadge>
  );
}
export function ReportActivityHistory() {
  const user = useAuthUser();
  const [events, setEvents] = useState<ReportActivity[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => {
    const refresh = () => setEvents(user ? loadReportWorkspace(user.id).activities : []);
    refresh();
    window.addEventListener(REPORT_ACTIVITY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(REPORT_ACTIVITY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [user]);
  const invalid = Boolean(from && to && from > to);
  const rows = events.filter((event) => {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(event.occurredAt));
    return (
      !invalid &&
      (!action || event.action === action) &&
      (!from || day >= from) &&
      (!to || day <= to) &&
      `${event.reportNumber} ${event.target} ${event.subject} ${REPORT_ACTIONS[event.action]}`
        .toLocaleLowerCase("vi-VN")
        .includes(query.trim().toLocaleLowerCase("vi-VN"))
    );
  });
  const sort = useTableSort(
    rows,
    {
      time: (event) => sortDate(event.occurredAt),
      action: (event) => REPORT_ACTIONS[event.action],
      report: (event) => event.target,
    },
    { key: "time", direction: "desc" },
    `${query}:${action}:${from}:${to}`,
  );
  const pagination = useListPagination(
    sort.rows,
    JSON.stringify([query, action, from, to, sort.sort]),
  );
  return (
    <section className="admin-panel report-activity" aria-labelledby="report-activity-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="report-activity-title">Hoạt động với báo cáo vi phạm</h2>
          <p>{rows.length} hoạt động · Mới nhất trước · Giờ Việt Nam (UTC+7)</p>
        </div>
        <Link to="/staff/reports" className="admin-text-link">
          Tới hộp thư báo cáo <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <p className="report-activity-source" role="note">
        Lịch sử mẫu trong trình duyệt này của tài khoản đang đăng nhập. Các bản ghi này không phải
        nhật ký kiểm toán từ máy chủ.
      </p>
      <div className="admin-list-toolbar report-activity-toolbar">
        <ListSearch
          label="Tìm báo cáo, đối tượng hoặc hành động"
          value={query}
          onChange={setQuery}
          count={rows.length}
        />
        <label className="admin-sample-filter">
          Hành động
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Tất cả hành động</option>
            {Object.entries(REPORT_ACTIONS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-sample-filter">
          Từ ngày
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "report-activity-date-error" : undefined}
          />
        </label>
        <label className="admin-sample-filter">
          Đến ngày
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "report-activity-date-error" : undefined}
          />
        </label>
      </div>
      {invalid && (
        <p id="report-activity-date-error" role="alert">
          Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.
        </p>
      )}
      {rows.length ? (
        <div
          className="admin-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Lịch sử báo cáo vi phạm"
        >
          <table className="admin-record-table report-activity-table">
            <thead>
              <tr>
                <SortableHeader label="Thời điểm" column="time" {...sort} scope="all" />
                <SortableHeader label="Hành động" column="action" {...sort} scope="all" />
                <SortableHeader label="Báo cáo / đối tượng" column="report" {...sort} scope="all" />
                <th>Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((event) => (
                <tr key={event.id}>
                  <td>
                    <time dateTime={event.occurredAt}>
                      {new Date(event.occurredAt).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </time>
                  </td>
                  <td>
                    <span className="report-activity-action">
                      <History size={15} aria-hidden="true" />
                      {REPORT_ACTIONS[event.action]}
                    </span>
                  </td>
                  <td>
                    <strong>Báo cáo mẫu #{event.reportNumber}</strong>
                    <span>{event.target}</span>
                    <small>{event.subject}</small>
                  </td>
                  <td>
                    <div className="report-activity-transition">
                      <span className="sr-only">Trước: </span>
                      {value(event.before)}
                      <ArrowRight size={14} aria-hidden="true" />
                      <span className="sr-only">Sau: </span>
                      {value(event.after)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-list-empty">
          <h3>{events.length ? "Không có hoạt động phù hợp" : "Chưa có thao tác với báo cáo"}</h3>
          <p>
            {events.length
              ? "Thay đổi từ khóa hoặc bộ lọc để xem các thao tác khác."
              : "Mở báo cáo hoặc cập nhật nhãn xử lý để ghi nhận hoạt động tại đây."}
          </p>
        </div>
      )}
      {rows.length > 0 && (
        <AdminPagination
          totalItems={rows.length}
          page={pagination.page}
          onPageChange={pagination.onPageChange}
          itemLabel="hoạt động"
        />
      )}
    </section>
  );
}
