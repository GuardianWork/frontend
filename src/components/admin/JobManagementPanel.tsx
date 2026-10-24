import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, Flag, Search, ShieldOff } from "lucide-react";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { ListSearch } from "@/components/ListSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useListPagination } from "@/hooks/useListPagination";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { matchesSearch } from "@/lib/list-search";
import { JOB_SAMPLE_RECORDS, type ManagedJob } from "@/lib/staff-jobs";
import "@/components/admin/compliance.css";

type QueueFilter = "ALL" | "PENDING" | "PUBLIC" | "REJECTED" | "HIDDEN" | "OPEN" | "REVIEWED";
type Action = "approve" | "reject" | "hide" | "restore";
const ACTION_LABELS: Record<Action, string> = {
  approve: "Đồng ý đăng tin",
  reject: "Từ chối đăng tin",
  hide: "Ẩn tin đã đăng",
  restore: "Công khai lại tin",
};
const STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  PUBLIC: "Đang công khai",
  REJECTED: "Đã từ chối",
  HIDDEN: "Đã ẩn",
};

const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value))
    : "Chưa có";
const priorityLabel = (job: ManagedJob) =>
  job.priority === "HIGH"
    ? "Ưu tiên cao"
    : job.priority === "MEDIUM"
      ? "Cần xem xét"
      : "Chưa có kết quả";
const statusTone = (job: ManagedJob): StaffStatusTone =>
  job.visibility === "PENDING"
    ? "pending"
    : job.visibility === "REJECTED"
      ? "rejected"
      : job.visibility === "HIDDEN"
        ? "neutral"
        : "verified";
const queueLabel = (job: ManagedJob) =>
  job.visibility !== "PUBLIC"
    ? STATUS_LABELS[job.visibility]
    : job.reviewed
      ? "Đã xem xét"
      : "Chưa xử lý";

export function JobManagementPanel() {
  const [jobs, setJobs] = useState(JOB_SAMPLE_RECORDS);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [queue, setQueue] = useState<QueueFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusId = useRef<string | null>(null);
  const selected = jobs.find((job) => job.id === selectedId);
  const remaining = jobs.filter((job) => job.visibility === "PUBLIC" && !job.reviewed).length;
  const filtered = useMemo(
    () =>
      jobs.filter(
        (job) =>
          matchesSearch(
            query,
            job.id,
            job.title,
            job.company,
            ...job.findings.map((finding) => finding.label),
          ) &&
          (priority === "ALL" || priority === job.priority) &&
          (queue === "ALL" ||
            queue === job.visibility ||
            (queue === "OPEN" && job.visibility === "PUBLIC" && !job.reviewed) ||
            (queue === "REVIEWED" && job.visibility === "PUBLIC" && job.reviewed) ||
            (queue === "HIDDEN" && job.visibility === "HIDDEN")),
      ),
    [jobs, priority, query, queue],
  );

  const pagination = useListPagination(filtered, JSON.stringify([query, priority, queue]));
  const historyPagination = useListPagination(selected?.history ?? [], selectedId ?? "");

  useEffect(() => {
    if (selectedId) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.closest("main")?.scrollTo({ top: 0 });
    } else if (returnFocusId.current) {
      const trigger = document.getElementById(`compliance-open-${returnFocusId.current}`);
      if (trigger) trigger.focus();
      else document.getElementById("compliance-list-title")?.focus();
    }
  }, [selectedId]);

  function openJob(id: string) {
    returnFocusId.current = id;
    setSelectedId(id);
    setNotice("");
  }
  function openAction(next: Action) {
    setAction(next);
    setReason("");
    setActionError("");
  }
  function recordAction(type: Action | "review") {
    if (!selected) return;
    if (type !== "review" && type !== "approve" && !reason.trim()) {
      setActionError("Nhập lý do để lưu thao tác xử lý.");
      return;
    }
    const allowed =
      type === "approve" || type === "reject"
        ? selected.visibility === "PENDING"
        : type === "restore"
          ? selected.visibility === "HIDDEN"
          : selected.visibility === "PUBLIC";
    if (!allowed) return;
    const label =
      type === "approve"
        ? "Đã đồng ý đăng tin"
        : type === "reject"
          ? "Đã từ chối đăng tin"
          : type === "hide"
            ? "Đã ẩn tin"
            : type === "restore"
              ? "Đã công khai lại"
              : "Đã xem xét";
    setJobs((current) =>
      current.map((job) =>
        job.id !== selected.id
          ? job
          : {
              ...job,
              reviewed: true,
              visibility:
                type === "approve" || type === "restore"
                  ? "PUBLIC"
                  : type === "reject"
                    ? "REJECTED"
                    : type === "hide"
                      ? "HIDDEN"
                      : job.visibility,
              publishedAt: type === "approve" ? new Date().toISOString() : job.publishedAt,
              history: [
                ...job.history,
                {
                  label,
                  at: new Date().toISOString(),
                  ...(type !== "review" ? { reason: reason.trim() } : {}),
                },
              ],
            },
      ),
    );
    setAction(null);
    setReason("");
    setNotice(`${label}. Thay đổi chỉ áp dụng cho dữ liệu mẫu trong màn hình này.`);
  }
  function clearFilters() {
    setQuery("");
    setPriority("ALL");
    setQueue("ALL");
  }

  return (
    <>
      {selected && (
        <button
          type="button"
          className="admin-text-link compliance-back"
          onClick={() => setSelectedId(null)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Quay lại danh sách
        </button>
      )}
      {selected && (
        <div className="admin-page-heading">
          <div>
            <h2 className="job-detail-title" ref={headingRef} tabIndex={-1}>
              {selected.title}
            </h2>
            <p>
              {selected.company} · {selected.id}
            </p>
          </div>
        </div>
      )}
      {notice && (
        <p className="compliance-notice" role="status">
          <Check size={17} aria-hidden="true" />
          {notice}
        </p>
      )}

      {!selected ? (
        <section className="admin-panel compliance-list" aria-labelledby="compliance-list-title">
          <div className="admin-panel-heading">
            <div>
              <h2 id="compliance-list-title" tabIndex={-1}>
                Tin tuyển dụng gần đây
              </h2>
              <p>
                {jobs.length} tin · {jobs.filter((job) => job.visibility === "PENDING").length} chờ
                duyệt · {remaining} tin công khai chưa xử lý
              </p>
            </div>
          </div>
          <div className="admin-sample-toolbar compliance-toolbar">
            <ListSearch
              value={query}
              onChange={setQuery}
              label="Tìm tin, doanh nghiệp hoặc dấu hiệu AI"
              count={filtered.length}
            />
            <label className="admin-sample-filter">
              Mức ưu tiên
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="HIGH">Ưu tiên cao</option>
                <option value="MEDIUM">Cần xem xét</option>
                <option value="NONE">Chưa có kết quả AI</option>
              </select>
            </label>
            <label className="admin-sample-filter">
              Trạng thái
              <select
                value={queue}
                onChange={(event) => setQueue(event.target.value as QueueFilter)}
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="PUBLIC">Đang công khai</option>
                <option value="REJECTED">Đã từ chối</option>
                <option value="OPEN">Công khai · Chưa xử lý</option>
                <option value="REVIEWED">Đã xem xét</option>
                <option value="HIDDEN">Đã ẩn</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <table className="compliance-table">
              <caption className="sr-only">Danh sách tin tuyển dụng</caption>
              <thead>
                <tr>
                  <th scope="col">Tin tuyển dụng</th>
                  <th scope="col">AI phát hiện</th>
                  <th scope="col">Ưu tiên</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Ngày gửi</th>
                  <th scope="col">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((job) => (
                  <tr key={job.id}>
                    <td className="compliance-job">
                      <button
                        id={`compliance-open-${job.id}`}
                        type="button"
                        onClick={() => openJob(job.id)}
                      >
                        {job.title}
                      </button>
                      <span>{job.company}</span>
                      <small>
                        {job.id} · {job.industry}
                      </small>
                    </td>
                    <td className="compliance-findings-cell">
                      {job.findings.length === 0 && (
                        <span className="compliance-no-findings">Chưa có kết quả quét AI</span>
                      )}
                      <ul>
                        {job.findings.map((finding) => (
                          <li key={finding.label}>{finding.label}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="compliance-priority-cell">
                      <span
                        className={`compliance-priority ${job.priority === "HIGH" ? "is-high" : ""}`}
                      >
                        {job.priority !== "NONE" && <Flag size={13} aria-hidden="true" />}
                        {priorityLabel(job)}
                      </span>
                    </td>
                    <td className="compliance-state-cell">
                      <StaffStatusBadge className="compliance-visibility" tone={statusTone(job)}>
                        {STATUS_LABELS[job.visibility]}
                      </StaffStatusBadge>
                      <small>
                        {job.visibility === "PUBLIC" && job.findings.length > 0
                          ? queueLabel(job)
                          : ""}
                      </small>
                    </td>
                    <td className="compliance-time">
                      <span className="compliance-mobile-label">Ngày gửi</span>
                      <time dateTime={job.submittedAt ?? job.publishedAt ?? undefined}>
                        {dateTime(job.submittedAt ?? job.publishedAt)}
                      </time>
                    </td>
                    <td className="compliance-row-action">
                      <button
                        type="button"
                        aria-label={`Xem chi tiết ${job.title}`}
                        className="admin-sample-detail-button"
                        onClick={() => openJob(job.id)}
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="compliance-empty" role="status">
              <Search size={26} aria-hidden="true" />
              <h3>Không có tin phù hợp</h3>
              <p>Thử từ khóa khác hoặc thay đổi bộ lọc để xem tin tuyển dụng.</p>
              <button type="button" className="admin-secondary-action" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}
          <AdminPagination
            totalItems={filtered.length}
            page={pagination.page}
            onPageChange={pagination.onPageChange}
            itemLabel="JD"
            label="Phân trang tin tuyển dụng"
          />
          <p className="compliance-list-note">
            Dấu hiệu do AI gắn cờ cần được kiểm tra cùng toàn bộ JD trước khi xử lý tin.
          </p>
        </section>
      ) : (
        <div className="compliance-detail-layout">
          <section className="admin-panel compliance-jd" aria-labelledby="published-jd-title">
            <div className="admin-panel-heading">
              <h2 id="published-jd-title">Nội dung JD</h2>
              <StaffStatusBadge className="compliance-visibility" tone={statusTone(selected)}>
                {STATUS_LABELS[selected.visibility]}
              </StaffStatusBadge>
            </div>
            <dl className="compliance-job-meta">
              <div>
                <dt>Doanh nghiệp</dt>
                <dd>{selected.company}</dd>
              </div>
              <div>
                <dt>Địa điểm</dt>
                <dd>{selected.location}</dd>
              </div>
              <div>
                <dt>Đã đăng lúc</dt>
                <dd>
                  <time dateTime={selected.publishedAt ?? undefined}>
                    {selected.publishedAt ? dateTime(selected.publishedAt) : "Chưa đăng"}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Ngành nghề</dt>
                <dd>{selected.industry}</dd>
              </div>
            </dl>
            {selected.findings.length > 0 && (
              <p className="compliance-highlight-note">
                Các đoạn tô vàng là nội dung AI gắn cờ cần bạn kiểm tra.
              </p>
            )}
            <div className="compliance-jd-content">
              {selected.description.split("\n\n").map((section, index) => {
                const [title, ...body] = section.split("\n");
                return (
                  <section key={index}>
                    <h3>{title}</h3>
                    {body.map((line, lineIndex) => (
                      <p key={lineIndex}>
                        {highlightFlaggedText(
                          line,
                          selected.findings.map((finding) => finding.excerpt),
                        )}
                      </p>
                    ))}
                  </section>
                );
              })}
            </div>
          </section>
          <aside className="compliance-inspector">
            <section className="admin-panel" aria-labelledby="ai-findings-title">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="ai-findings-title">Dấu hiệu AI phát hiện</h2>
                  <p>
                    <time dateTime={selected.detectedAt ?? undefined}>
                      {dateTime(selected.detectedAt)}
                    </time>
                  </p>
                </div>
                <span
                  className={`compliance-priority ${selected.priority === "HIGH" ? "is-high" : ""}`}
                >
                  {priorityLabel(selected)}
                </span>
              </div>
              {selected.findings.length === 0 && (
                <p className="compliance-ai-empty">Chưa có kết quả quét AI cho tin này.</p>
              )}
              <ol className="compliance-finding-list">
                {selected.findings.map((finding) => (
                  <li key={finding.label}>
                    <h3>{finding.label}</h3>
                    <blockquote>{finding.excerpt}</blockquote>
                    <p>{finding.explanation}</p>
                  </li>
                ))}
              </ol>
              <p className="compliance-list-note">
                Kết quả gắn cờ hỗ trợ kiểm tra nội dung, chưa phải kết luận vi phạm.
              </p>
            </section>
            <section className="admin-panel compliance-handling" aria-labelledby="handling-title">
              <h2 id="handling-title">Xử lý tin tuyển dụng</h2>
              <p>{queueLabel(selected)} · Thao tác trên dữ liệu minh họa.</p>
              <div>
                {selected.visibility === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      className="admin-primary-action"
                      onClick={() => openAction("approve")}
                    >
                      <Check size={16} aria-hidden="true" /> Đồng ý đăng tin
                    </button>
                    <button
                      type="button"
                      className="admin-secondary-action job-reject-action"
                      onClick={() => openAction("reject")}
                    >
                      Từ chối đăng tin
                    </button>
                  </>
                ) : selected.visibility === "PUBLIC" ? (
                  <>
                    {selected.findings.length > 0 && (
                      <button
                        type="button"
                        className="admin-secondary-action"
                        disabled={selected.reviewed}
                        onClick={() => recordAction("review")}
                      >
                        <Check size={16} aria-hidden="true" />
                        {selected.reviewed ? "Đã xem xét" : "Đánh dấu đã xem xét"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-primary-action job-hide-action"
                      onClick={() => openAction("hide")}
                    >
                      <ShieldOff size={16} aria-hidden="true" />
                      Ẩn tin đã đăng
                    </button>
                  </>
                ) : selected.visibility === "HIDDEN" ? (
                  <button
                    type="button"
                    className="admin-secondary-action"
                    onClick={() => openAction("restore")}
                  >
                    <Eye size={16} aria-hidden="true" />
                    Công khai lại tin
                  </button>
                ) : (
                  <p>Tin đã bị từ chối. Xem lý do trong lịch sử xử lý.</p>
                )}
              </div>
            </section>
            {selected.history.length > 0 && (
              <section className="admin-panel compliance-history" aria-labelledby="history-title">
                <h2 id="history-title">Lịch sử xử lý</h2>
                <ol>
                  {historyPagination.items.map((event, index) => (
                    <li key={index}>
                      <strong>{event.label}</strong>
                      <time dateTime={event.at}>{dateTime(event.at)}</time>
                      {event.reason && <p>{event.reason}</p>}
                    </li>
                  ))}
                </ol>
                <AdminPagination
                  totalItems={selected.history.length}
                  page={historyPagination.page}
                  onPageChange={historyPagination.onPageChange}
                  itemLabel="thao tác"
                  label="Phân trang lịch sử xử lý"
                />
              </section>
            )}
          </aside>
        </div>
      )}

      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
      >
        <DialogContent className="compliance-action-dialog">
          <DialogTitle>{action ? ACTION_LABELS[action] : "Xử lý tin"}</DialogTitle>
          <DialogDescription className="compliance-action-description">
            {selected?.title} · {selected?.company}. Đây là thao tác trên dữ liệu mẫu.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (action) recordAction(action);
            }}
          >
            <label htmlFor="compliance-action-reason">
              {action === "reject" ? "Lý do từ chối" : "Lý do xử lý"}{" "}
              {action === "approve" ? "(không bắt buộc)" : <span aria-hidden="true">*</span>}
            </label>
            <textarea
              id="compliance-action-reason"
              autoFocus
              required={action !== "approve"}
              maxLength={1000}
              rows={4}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setActionError("");
              }}
              aria-invalid={Boolean(actionError)}
              aria-describedby={actionError ? "compliance-action-error" : undefined}
              placeholder="Nhập lý do để ghi lại trong lịch sử xử lý"
            />
            {actionError && (
              <p id="compliance-action-error" role="alert" className="compliance-action-error">
                {actionError}
              </p>
            )}
            <div className="compliance-dialog-actions">
              <button
                type="button"
                className="admin-secondary-action"
                onClick={() => setAction(null)}
              >
                Hủy
              </button>
              <button type="submit" className="admin-primary-action">
                {action === "approve"
                  ? "Xác nhận đồng ý đăng tin"
                  : action === "reject"
                    ? "Xác nhận từ chối đăng tin"
                    : action === "hide"
                      ? "Xác nhận ẩn tin"
                      : "Xác nhận công khai lại"}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function highlightFlaggedText(text: string, excerpts: string[]) {
  const matches = excerpts
    .flatMap((excerpt) => {
      if (!excerpt) return [];
      const found: { start: number; end: number }[] = [];
      let start = text.indexOf(excerpt);
      while (start !== -1) {
        found.push({ start, end: start + excerpt.length });
        start = text.indexOf(excerpt, start + excerpt.length);
      }
      return found;
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    parts.push(text.slice(cursor, match.start));
    parts.push(
      <mark key={match.start} className="compliance-highlight">
        {text.slice(match.start, match.end)}
      </mark>,
    );
    cursor = match.end;
  }
  parts.push(text.slice(cursor));
  return parts;
}
