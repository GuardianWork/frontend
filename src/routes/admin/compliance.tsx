import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Database,
  Eye,
  Flag,
  Search,
  ShieldOff,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ListSearch } from "@/components/ListSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useListPagination } from "@/hooks/useListPagination";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { matchesSearch } from "@/lib/list-search";
import { COMPLIANCE_SAMPLE_JOBS, type FlaggedPublishedJob } from "@/lib/admin-compliance";
import "@/components/admin/compliance.css";

type QueueFilter = "ALL" | "OPEN" | "REVIEWED" | "HIDDEN";
type Action = "hide" | "restore";
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
const priorityLabel = (job: FlaggedPublishedJob) =>
  job.priority === "HIGH" ? "Ưu tiên cao" : "Cần xem xét";
const queueLabel = (job: FlaggedPublishedJob) =>
  job.visibility === "HIDDEN" ? "Đã ẩn" : job.reviewed ? "Đã xem xét" : "Chưa xử lý";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "JD bị AI gắn cờ — GuardianWork" },
      {
        name: "description",
        content:
          "Theo dõi các JD đã đăng được AI gắn cờ và xử lý tin tuyển dụng sau khi công khai.",
      },
    ],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  const [jobs, setJobs] = useState(COMPLIANCE_SAMPLE_JOBS);
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
    if (type !== "review" && !reason.trim()) {
      setActionError("Nhập lý do để lưu thao tác xử lý.");
      return;
    }
    const label =
      type === "hide" ? "Đã ẩn tin" : type === "restore" ? "Đã công khai lại" : "Đã xem xét";
    setJobs((current) =>
      current.map((job) =>
        job.id !== selected.id
          ? job
          : {
              ...job,
              reviewed: true,
              visibility:
                type === "hide" ? "HIDDEN" : type === "restore" ? "PUBLIC" : job.visibility,
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
    <AdminShell title="JD bị AI gắn cờ" role="admin">
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
      <div className="admin-page-heading">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            {selected ? selected.title : "JD bị AI gắn cờ"}
          </h1>
          <p>
            {selected
              ? `${selected.company} · ${selected.id}`
              : "Theo dõi các tin đã đăng được AI phát hiện có dấu hiệu cần xem xét."}
          </p>
        </div>
        <span className="admin-draft-label admin-sample-label">
          <Database size={14} aria-hidden="true" />
          Dữ liệu minh họa
        </span>
      </div>
      <div className="admin-sample-banner" role="note">
        <CircleHelp size={18} aria-hidden="true" />
        <p>
          <strong>Quản lý sau đăng.</strong> Danh sách chỉ gồm JD đã được công khai. Bản ghi và kết
          quả AI bên dưới là minh họa; thao tác xử lý chỉ áp dụng trong màn hình này.
        </p>
      </div>
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
                Tin tuyển dụng cần kiểm tra
              </h2>
              <p>
                {jobs.length} JD được gắn cờ · {remaining} tin công khai chưa xử lý
              </p>
            </div>
          </div>
          <div className="admin-sample-toolbar compliance-toolbar">
            <ListSearch
              value={query}
              onChange={setQuery}
              label="Tìm JD, doanh nghiệp hoặc dấu hiệu"
              count={filtered.length}
            />
            <label className="admin-sample-filter">
              Mức ưu tiên
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="HIGH">Ưu tiên cao</option>
                <option value="MEDIUM">Cần xem xét</option>
              </select>
            </label>
            <label className="admin-sample-filter">
              Xử lý
              <select
                value={queue}
                onChange={(event) => setQueue(event.target.value as QueueFilter)}
              >
                <option value="ALL">Tất cả</option>
                <option value="OPEN">Chưa xử lý</option>
                <option value="REVIEWED">Đã xem xét</option>
                <option value="HIDDEN">Đã ẩn</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <table className="compliance-table">
              <caption className="sr-only">Danh sách JD đã đăng được AI gắn cờ</caption>
              <thead>
                <tr>
                  <th scope="col">Tin tuyển dụng</th>
                  <th scope="col">AI phát hiện</th>
                  <th scope="col">Ưu tiên</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Phát hiện lúc</th>
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
                        <Flag size={13} aria-hidden="true" />
                        {priorityLabel(job)}
                      </span>
                    </td>
                    <td className="compliance-state-cell">
                      <span
                        className={`compliance-visibility ${job.visibility === "HIDDEN" ? "is-hidden" : ""}`}
                      >
                        {job.visibility === "PUBLIC" ? "Đang công khai" : "Đã ẩn"}
                      </span>
                      <small>
                        {job.visibility === "PUBLIC" ? queueLabel(job) : "Sau khi đăng"}
                      </small>
                    </td>
                    <td className="compliance-time">
                      <span className="compliance-mobile-label">Phát hiện lúc</span>
                      <time dateTime={job.detectedAt}>{dateTime(job.detectedAt)}</time>
                    </td>
                    <td className="compliance-row-action">
                      <button
                        type="button"
                        aria-label={`Xem JD ${job.title}`}
                        className="admin-sample-detail-button"
                        onClick={() => openJob(job.id)}
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>Xem JD</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="compliance-empty" role="status">
              <Search size={26} aria-hidden="true" />
              <h3>Không có JD phù hợp</h3>
              <p>Thử từ khóa khác hoặc thay đổi bộ lọc để xem các tin đã được gắn cờ.</p>
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
            label="Phân trang JD bị AI gắn cờ"
          />
          <p className="compliance-list-note">
            Dấu hiệu do AI gắn cờ cần được kiểm tra cùng toàn bộ JD trước khi xử lý tin.
          </p>
        </section>
      ) : (
        <div className="compliance-detail-layout">
          <section className="admin-panel compliance-jd" aria-labelledby="published-jd-title">
            <div className="admin-panel-heading">
              <h2 id="published-jd-title">Nội dung JD đã đăng</h2>
              <span
                className={`compliance-visibility ${selected.visibility === "HIDDEN" ? "is-hidden" : ""}`}
              >
                {selected.visibility === "PUBLIC" ? "Đang công khai" : "Đã ẩn"}
              </span>
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
                  <time dateTime={selected.publishedAt}>{dateTime(selected.publishedAt)}</time>
                </dd>
              </div>
              <div>
                <dt>Ngành nghề</dt>
                <dd>{selected.industry}</dd>
              </div>
            </dl>
            <div className="compliance-jd-content">
              {selected.description.split("\n\n").map((section, index) => {
                const [title, ...body] = section.split("\n");
                return (
                  <section key={index}>
                    <h3>{title}</h3>
                    {body.map((line, lineIndex) => (
                      <p key={lineIndex}>{line}</p>
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
                    <time dateTime={selected.detectedAt}>{dateTime(selected.detectedAt)}</time>
                  </p>
                </div>
                <span
                  className={`compliance-priority ${selected.priority === "HIGH" ? "is-high" : ""}`}
                >
                  {priorityLabel(selected)}
                </span>
              </div>
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
              <h2 id="handling-title">Xử lý tin đã đăng</h2>
              <p>{queueLabel(selected)} · Thao tác trên dữ liệu minh họa.</p>
              <div>
                {selected.visibility === "PUBLIC" ? (
                  <>
                    <button
                      type="button"
                      className="admin-secondary-action"
                      disabled={selected.reviewed}
                      onClick={() => recordAction("review")}
                    >
                      <Check size={16} aria-hidden="true" />
                      {selected.reviewed ? "Đã xem xét" : "Đánh dấu đã xem xét"}
                    </button>
                    <button
                      type="button"
                      className="admin-primary-action"
                      onClick={() => openAction("hide")}
                    >
                      <ShieldOff size={16} aria-hidden="true" />
                      Ẩn tin đã đăng
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="admin-secondary-action"
                    onClick={() => openAction("restore")}
                  >
                    <Eye size={16} aria-hidden="true" />
                    Công khai lại tin
                  </button>
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
          <DialogTitle>
            {action === "hide" ? "Ẩn tin tuyển dụng đã đăng" : "Công khai lại tin tuyển dụng"}
          </DialogTitle>
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
              Lý do xử lý <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="compliance-action-reason"
              autoFocus
              required
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
                {action === "hide" ? "Xác nhận ẩn tin" : "Xác nhận công khai lại"}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
