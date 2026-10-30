import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Database, Search } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListSearch } from "@/components/ListSearch";
import { useListPagination } from "@/hooks/useListPagination";
import { matchesSearch } from "@/lib/list-search";
import { AUDIT_ACTION_LABELS, AUDIT_SAMPLE_ENTRIES } from "@/lib/admin-audit-logs";
import "@/components/admin/audit-logs.css";

export const Route = createFileRoute("/staff/audit-logs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Audit logs — Platform staff GuardianWork" },
    ],
  }),
  component: AuditLogsPage,
});

const timestamp = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const invalidDates = Boolean(from && to && from > to);
  const rows = AUDIT_SAMPLE_ENTRIES.filter((entry) => {
    const date = entry.createdAt.slice(0, 10);
    return (
      !invalidDates &&
      (action === "ALL" || entry.action === action) &&
      (!from || date >= from) &&
      (!to || date <= to) &&
      matchesSearch(
        query,
        entry.id,
        entry.actor.name,
        entry.actor.email,
        String(entry.actor.id),
        entry.action,
        AUDIT_ACTION_LABELS[entry.action],
        entry.target,
        entry.targetId,
        entry.reason,
        timestamp.format(new Date(entry.createdAt)),
      )
    );
  });
  const pagination = useListPagination(rows, JSON.stringify([query, action, from, to]));
  const filtered = Boolean(query || action !== "ALL" || from || to);
  function clearFilters() {
    setQuery("");
    setAction("ALL");
    setFrom("");
    setTo("");
  }

  return (
    <AdminShell title="Audit logs" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Audit logs</h1>
          <p>Tra cứu ai đã thực hiện thay đổi, thời điểm thực hiện và nội dung thay đổi.</p>
        </div>
        <span className="admin-draft-label admin-sample-label">
          <Database size={14} aria-hidden="true" /> Dữ liệu mẫu
        </span>
      </div>
      <div className="admin-sample-banner" role="note">
        <Database size={18} aria-hidden="true" />
        <p>
          Nhật ký dưới đây là dữ liệu minh họa, chưa kết nối API audit logs. Các thay đổi thực tế
          của hệ thống chưa được hiển thị tại đây.
        </p>
      </div>
      <section className="admin-panel audit-panel" aria-labelledby="audit-list-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="audit-list-title">Nhật ký thay đổi</h2>
            <p>Mới nhất trước · Giờ Việt Nam (UTC+7) · 10 bản ghi mỗi trang</p>
          </div>
        </div>
        <div className="admin-sample-toolbar audit-toolbar">
          <ListSearch
            value={query}
            onChange={setQuery}
            label="Tìm người thực hiện, hành động, đối tượng…"
            count={rows.length}
          />
          <div className="audit-filters">
            <label className="admin-sample-filter">
              Hành động
              <select value={action} onChange={(event) => setAction(event.target.value)}>
                <option value="ALL">Tất cả hành động</option>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
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
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                aria-invalid={invalidDates || undefined}
                aria-describedby={invalidDates ? "audit-date-error" : undefined}
              />
            </label>
            <label className="admin-sample-filter">
              Đến ngày
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                aria-invalid={invalidDates || undefined}
                aria-describedby={invalidDates ? "audit-date-error" : undefined}
              />
            </label>
            {filtered && (
              <button type="button" className="admin-text-link" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
          {invalidDates && (
            <p id="audit-date-error" className="audit-date-error" role="alert">
              Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.
            </p>
          )}
        </div>
        {rows.length ? (
          <div
            className="admin-table-scroll"
            role="region"
            aria-label="Bảng nhật ký thay đổi"
            tabIndex={0}
          >
            <table className="admin-record-table audit-table" role="table">
              <caption className="sr-only">Nhật ký thay đổi mẫu, sắp xếp mới nhất trước</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col">Thời điểm</th>
                  <th scope="col">Người thực hiện</th>
                  <th scope="col">Hành động</th>
                  <th scope="col">Đối tượng</th>
                  <th scope="col">Chi tiết</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {pagination.items.map((entry) => (
                  <Fragment key={entry.id}>
                    <tr role="row">
                      <td role="cell" data-label="Thời điểm">
                        <time dateTime={entry.createdAt}>
                          {timestamp.format(new Date(entry.createdAt))}
                        </time>
                        <small>{entry.id}</small>
                      </td>
                      <td role="cell" data-label="Người thực hiện">
                        <strong>{entry.actor.name}</strong>
                        <small>{entry.actor.email}</small>
                      </td>
                      <td role="cell" data-label="Hành động">
                        <span
                          className={`audit-action ${["REJECT_COMPANY", "HIDE_JOB", "LOCK_ACCOUNT"].includes(entry.action) ? "audit-action--attention" : "audit-action--positive"}`}
                        >
                          {AUDIT_ACTION_LABELS[entry.action]}
                        </span>
                      </td>
                      <td role="cell" data-label="Đối tượng">
                        <strong>{entry.target}</strong>
                        <small>{entry.targetId}</small>
                      </td>
                      <td role="cell" data-label="Chi tiết">
                        <button
                          type="button"
                          className="admin-sample-detail-button"
                          aria-label={`Chi tiết ${entry.id}`}
                          aria-expanded={expandedId === entry.id}
                          aria-controls={`detail-${entry.id}`}
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        >
                          <span>{expandedId === entry.id ? "Thu gọn" : "Xem"}</span>
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr id={`detail-${entry.id}`} className="audit-detail-row" role="row">
                        <td colSpan={5} role="cell">
                          <div className="audit-detail">
                            <div className="audit-change">
                              <div>
                                <span>Trước thay đổi</span>
                                <strong>{entry.before}</strong>
                              </div>
                              <ArrowRight size={18} aria-hidden="true" />
                              <div>
                                <span>Sau thay đổi</span>
                                <strong>{entry.after}</strong>
                              </div>
                            </div>
                            <p>
                              <strong>Lý do:</strong> {entry.reason}
                            </p>
                            <p className="audit-actor-id">Mã người thực hiện: #{entry.actor.id}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-sample-empty">
            <Search size={24} aria-hidden="true" />
            <h3>Không tìm thấy nhật ký</h3>
            <p>Thử từ khóa khác hoặc thay đổi bộ lọc để xem nhật ký.</p>
            <button type="button" className="admin-secondary-action" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        )}
        <AdminPagination
          totalItems={rows.length}
          page={pagination.page}
          onPageChange={pagination.onPageChange}
          itemLabel="bản ghi"
          label="Phân trang audit logs"
        />
      </section>
    </AdminShell>
  );
}
