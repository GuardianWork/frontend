import { useMemo, useState } from "react";
import { ArrowRight, Eye, Check, Clock3 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ListSearch } from "@/components/ListSearch";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTableSort } from "@/hooks/useTableSort";
import { sortDate } from "@/lib/table-sort";
import { AdminPagination } from "./AdminPagination";
import { useListPagination } from "@/hooks/useListPagination";
import { SortableHeader } from "./SortableHeader";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { AREAS } from "./AdminDraftPage";
import {
  loadReportWorkspace,
  commitReportChange,
  type ReportLocalState as ReportState,
  type ReportStates as SavedState,
  type ReportActivity,
} from "@/services/staffReportsLocal";
import "./staff-reports.css";

const REPORTS = AREAS.reports.rows.map((row) => ({
  id: JSON.stringify([row.cells[0], row.cells[2], row.cells[1]]),
  target: row.cells[0],
  subject: row.cells[1],
  sentAt: row.cells[2],
  initialStatus: (row.status === "Đang xem xét" || row.status === "Đã xử lý"
    ? row.status
    : undefined) as ReportState["status"],
  searchable: row.searchable,
}));
type Report = (typeof REPORTS)[number];
type ReadFilter = "all" | "unread" | "read";
const TONES: Record<string, StaffStatusTone> = {
  "Đang xem xét": "pending",
  "Đã xử lý": "verified",
};
export function StaffReportsPage() {
  const user = useAuthUser();
  return (
    <AdminShell title="Báo cáo vi phạm" role="admin">
      {user ? (
        <ReportInbox key={user.id} userId={user.id} />
      ) : (
        <p role="status">Đang tải báo cáo…</p>
      )}
    </AdminShell>
  );
}

function ReportInbox({ userId }: { userId: number }) {
  const [saved, setSaved] = useState<SavedState>(() => loadReportWorkspace(userId).reports);
  const [storageError, setStorageError] = useState(false);
  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Report | null>(null);
  const [notice, setNotice] = useState("");
  const isRead = (report: Report) => Boolean(saved[report.id]?.read);
  const statusOf = (report: Report) => saved[report.id]?.status || report.initialStatus;
  const unreadCount = REPORTS.filter((report) => !isRead(report)).length;
  const statuses = ["Đang xem xét", "Đã xử lý"];
  const rows = useMemo(
    () =>
      REPORTS.filter((report) => {
        const read = Boolean(saved[report.id]?.read);
        const matchesRead = readFilter === "all" || (readFilter === "read" ? read : !read);
        const status = saved[report.id]?.status || report.initialStatus;
        return (
          matchesRead &&
          (statusFilter === "ALL" || status === statusFilter) &&
          `${report.searchable} ${report.target} ${report.subject}`
            .toLocaleLowerCase("vi-VN")
            .includes(query.trim().toLocaleLowerCase("vi-VN"))
        );
      }),
    [saved, query, readFilter, statusFilter],
  );
  const sort = useTableSort(
    rows,
    {
      target: (report) => report.target,
      subject: (report) => report.subject,
      sentAt: (report) => sortDate(report.sentAt),
      status: (report) => statusOf(report) || "",
    },
    { key: "sentAt", direction: "desc" },
    `${query}:${readFilter}:${statusFilter}`,
  );
  const pagination = useListPagination(
    sort.rows,
    JSON.stringify([query, readFilter, statusFilter, sort.sort]),
  );

  function update(report: Report, patch: Partial<ReportState>) {
    const next = {
      ...saved,
      [report.id]: { ...saved[report.id], ...patch, read: patch.read ?? isRead(report) },
    };
    const statusChanged = patch.status !== undefined && patch.status !== statusOf(report);
    const readChanged = patch.read !== undefined && patch.read !== isRead(report);
    if (!statusChanged && !readChanged) return;
    const activity: ReportActivity = {
      id: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      reportId: report.id,
      reportNumber: REPORTS.findIndex((item) => item.id === report.id) + 1,
      target: report.target,
      subject: report.subject,
      action: statusChanged
        ? patch.status === "Đang xem xét"
          ? "REVIEW"
          : "RESOLVE"
        : patch.read
          ? "READ"
          : "UNREAD",
      field: statusChanged ? "status" : "read",
      before: statusChanged ? statusOf(report) || null : isRead(report),
      after: statusChanged ? patch.status! : patch.read!,
    };
    setSaved(next);
    try {
      commitReportChange(userId, next, activity);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function open(report: Report) {
    update(report, { read: true });
    setSelected(report);
    setNotice("");
  }
  function mark(status: "Đang xem xét" | "Đã xử lý") {
    if (!selected) return;
    update(selected, { status });
    setNotice(`Đã đánh dấu báo cáo là “${status}”. Thay đổi chỉ lưu trong trình duyệt này.`);
  }
  return (
    <div className="staff-reports">
      <div className="admin-page-heading">
        <div>
          <h1>Báo cáo vi phạm</h1>
          <p>
            {unreadCount
              ? `${unreadCount} báo cáo chưa đọc. Mở chi tiết để kiểm tra nội dung phản ánh.`
              : "Bạn đã đọc tất cả báo cáo trong danh sách."}
          </p>
        </div>
      </div>
      <p className="staff-reports-source" role="note">
        <strong>Dữ liệu minh họa.</strong> Trạng thái đọc và xử lý chỉ lưu cho tài khoản này trong
        trình duyệt hiện tại, không cập nhật hệ thống.
      </p>
      {storageError && (
        <p role="alert">
          Không lưu được thay đổi trong trình duyệt. Trạng thái chỉ được giữ đến khi tải lại trang.
        </p>
      )}
      <section aria-labelledby="reports-inbox-title">
        <div className="staff-reports-title">
          <h2 id="reports-inbox-title">Hộp thư báo cáo</h2>
          <span>
            {rows.length} / {REPORTS.length} báo cáo
          </span>
        </div>
        <div className="staff-reports-tabs" role="group" aria-label="Lọc theo trạng thái đọc">
          {(
            [
              { value: "all", label: "Tất cả", count: REPORTS.length },
              { value: "unread", label: "Chưa đọc", count: unreadCount },
              { value: "read", label: "Đã đọc", count: REPORTS.length - unreadCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={readFilter === tab.value}
              onClick={() => setReadFilter(tab.value)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="admin-list-toolbar staff-reports-toolbar">
          <ListSearch
            label="Tìm đối tượng hoặc nội dung báo cáo"
            value={query}
            onChange={setQuery}
            count={rows.length}
          />
          <label className="admin-sample-filter">
            Trạng thái xử lý
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        {rows.length ? (
          <div
            className="admin-table-scroll"
            role="region"
            aria-label="Danh sách báo cáo vi phạm"
            tabIndex={0}
          >
            <table className="admin-record-table staff-reports-table">
              <caption className="sr-only">Báo cáo vi phạm và trạng thái đọc</caption>
              <thead>
                <tr>
                  <SortableHeader
                    label="Đối tượng bị báo cáo"
                    column="target"
                    {...sort}
                    scope="all"
                  />
                  <SortableHeader
                    label="Nội dung phản ánh"
                    column="subject"
                    {...sort}
                    scope="all"
                  />
                  <SortableHeader label="Thời điểm gửi" column="sentAt" {...sort} scope="all" />
                  <SortableHeader label="Trạng thái xử lý" column="status" {...sort} scope="all" />
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((report) => (
                  <tr key={report.id} data-unread={!isRead(report)}>
                    <td>
                      <strong>{report.target}</strong>
                      <span className="staff-report-read-state">
                        {!isRead(report) && (
                          <span className="staff-report-unread-dot" aria-hidden="true" />
                        )}
                        {isRead(report) ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </td>
                    <td>{report.subject}</td>
                    <td className="staff-report-date">{report.sentAt}</td>
                    <td>
                      {statusOf(report) ? (
                        <StaffStatusBadge tone={TONES[statusOf(report) || ""]} icon>
                          {statusOf(report)}
                        </StaffStatusBadge>
                      ) : (
                        <span className="sr-only">Chưa gắn nhãn xử lý</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-text-link"
                        onClick={() => open(report)}
                      >
                        <Eye size={15} aria-hidden="true" />
                        Xem chi tiết
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-list-empty">
            <h3>
              {readFilter === "unread" && !unreadCount
                ? "Không còn báo cáo chưa đọc"
                : "Không tìm thấy báo cáo phù hợp"}
            </h3>
            <p>Thay đổi bộ lọc hoặc xóa từ khóa để xem các báo cáo khác.</p>
            <button
              type="button"
              className="admin-text-link"
              onClick={() => {
                setQuery("");
                setReadFilter("all");
                setStatusFilter("ALL");
              }}
            >
              Xem tất cả báo cáo
            </button>
          </div>
        )}
        <AdminPagination
          totalItems={rows.length}
          page={pagination.page}
          onPageChange={pagination.onPageChange}
          itemLabel="báo cáo"
        />
      </section>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent
            className="staff-report-dialog"
            aria-describedby="staff-report-description"
          >
            <div className="staff-report-dialog-heading">
              <DialogTitle>{selected.target}</DialogTitle>
              <DialogDescription id="staff-report-description">
                Báo cáo vi phạm · {selected.sentAt} · Dữ liệu minh họa
              </DialogDescription>
            </div>
            <div className="staff-report-detail-grid">
              <section aria-labelledby="report-content-title">
                <h2 id="report-content-title">Nội dung phản ánh</h2>
                <p className="staff-report-concern">{selected.subject}</p>
                <h2>Bằng chứng</h2>
                <p>Không có tệp đính kèm trong dữ liệu mẫu.</p>
                <dl>
                  <div>
                    <dt>Người gửi</dt>
                    <dd>Tài khoản người dùng minh họa</dd>
                  </div>
                </dl>
              </section>
              <section
                className="staff-report-processing"
                aria-labelledby="report-processing-title"
              >
                <h2 id="report-processing-title">Theo dõi xử lý</h2>
                {statusOf(selected) && (
                  <StaffStatusBadge tone={TONES[statusOf(selected) || ""]} icon>
                    {statusOf(selected)}
                  </StaffStatusBadge>
                )}
                <p>Đánh dấu bước đang thực hiện sau khi kiểm tra nội dung báo cáo.</p>
                <div className="staff-report-status-actions">
                  <button
                    type="button"
                    className="admin-secondary-action"
                    disabled={statusOf(selected) === "Đang xem xét"}
                    onClick={() => mark("Đang xem xét")}
                  >
                    <Clock3 size={16} aria-hidden="true" />
                    Đang xem xét
                  </button>
                  <button
                    type="button"
                    className="admin-primary-action"
                    disabled={statusOf(selected) === "Đã xử lý"}
                    onClick={() => mark("Đã xử lý")}
                  >
                    <Check size={16} aria-hidden="true" />
                    Đã xử lý
                  </button>
                </div>
                <p className="staff-report-processing-note">
                  Thao tác chỉ thay đổi trạng thái mẫu, không áp dụng hình phạt cho tài khoản hay
                  tin tuyển dụng.
                </p>
              </section>
            </div>
            {notice && (
              <p className="staff-report-notice" role="status">
                {notice}
              </p>
            )}
            <div className="staff-report-dialog-footer">
              <button
                type="button"
                className="admin-text-link"
                onClick={() => {
                  update(selected, { read: false });
                  setSelected(null);
                }}
              >
                Đánh dấu chưa đọc
              </button>
              <button
                type="button"
                className="admin-secondary-action"
                onClick={() => setSelected(null)}
              >
                Đóng chi tiết
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
