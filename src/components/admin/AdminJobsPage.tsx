import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ClipboardCheck, Info, RotateCcw, Eye, EyeOff, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ListSearch } from "@/components/ListSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StaffStatusBadge } from "./StaffStatusBadge";
import { useListPagination } from "@/hooks/useListPagination";
import { matchesSearch } from "@/lib/list-search";
import {
  getCurrentUser,
  getJobApprovalQueue,
  COMPANY_WORKSPACE_EVENT,
  type JobApproval,
  jobModerationStatus,
  reviewCompanyJob,
  setCompanyJobVisibility,
  type CompanyJob,
} from "@/services/companyMembers";
import "@/components/admin/job-approvals.css";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const labels = {
  all: "Tất cả",
  pending: "Chờ duyệt",
  approved: "Đang công khai",
  rejected: "Đã từ chối",
  hidden: "Đã ẩn",
};
function displayStatus(job: CompanyJob): Exclude<keyof typeof labels, "all"> {
  const status = jobModerationStatus(job);
  return status === "approved" && job.visibility === "HIDDEN" ? "hidden" : status;
}
type Status = keyof typeof labels;
const date = (value?: string) =>
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
    : "Chưa cung cấp";
function StatusBadge({ job }: { job: CompanyJob }) {
  const status = displayStatus(job);
  return (
    <StaffStatusBadge
      tone={status === "approved" ? "verified" : status === "hidden" ? "neutral" : status}
    >
      {labels[status]}
    </StaffStatusBadge>
  );
}
export function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobApproval[]>([]);
  const [error, setError] = useState("");
  const user = getCurrentUser();
  const refresh = useCallback(() => {
    try {
      setJobs(getJobApprovalQueue());
      setError("");
    } catch (e) {
      setJobs([]);
      setError(e instanceof Error ? e.message : "Không tải được tin tuyển dụng.");
    }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener(COMPANY_WORKSPACE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COMPANY_WORKSPACE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [visibilityTarget, setVisibilityTarget] = useState<JobApproval | null>(null);
  const [visibilityReason, setVisibilityReason] = useState("");
  const [visibilityError, setVisibilityError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocusId = useRef<string | null>(null);
  const selected = jobs.find((job) => job.id === selectedId);
  const filtered = jobs.filter(
    (job) =>
      (filter === "all" || displayStatus(job) === filter) &&
      matchesSearch(query, job.title, job.department, job.location, job.companyName ?? ""),
  );
  const pagination = useListPagination(filtered, JSON.stringify([filter, query]));
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (selectedId) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.closest("main")?.scrollTo({ top: 0 });
    } else if (returnFocusId.current) {
      const trigger = document.getElementById(`approval-open-${returnFocusId.current}`);
      (trigger ?? heading.current)?.focus();
    }
  }, [selectedId]);
  function resetDecision() {
    setRejecting(false);
    setReason("");
    setActionError("");
  }
  function choose(job: CompanyJob) {
    returnFocusId.current = job.id;
    setSelectedId(job.id);
    setNotice("");
    resetDecision();
  }
  function decide(decision: "approved" | "rejected", target = selected) {
    if (!target) return;
    try {
      reviewCompanyJob(target.id, decision, reason, target.workspaceKey);
      setNotice(
        decision === "approved"
          ? "Đã phê duyệt tin. Ứng viên có thể xem và ứng tuyển trong workspace này."
          : "Đã từ chối tin. Lý do được lưu để nhà tuyển dụng xem lại.",
      );
      resetDecision();
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Không lưu được quyết định. Vui lòng thử lại.",
      );
    }
  }
  function openVisibility(job: JobApproval) {
    setVisibilityTarget(job);
    setVisibilityReason("");
    setVisibilityError("");
  }
  function changeVisibility() {
    if (!visibilityTarget) return;
    try {
      const next = visibilityTarget.visibility === "HIDDEN" ? "PUBLIC" : "HIDDEN";
      setCompanyJobVisibility(
        visibilityTarget.id,
        next,
        visibilityReason,
        visibilityTarget.workspaceKey,
      );
      setNotice(
        `${next === "HIDDEN" ? "Đã ẩn" : "Đã công khai lại"} tin “${visibilityTarget.title}”.`,
      );
      setVisibilityTarget(null);
    } catch (e) {
      setVisibilityError(
        e instanceof Error ? e.message : "Không thể thay đổi hiển thị. Vui lòng thử lại.",
      );
    }
  }
  function rowActions(job: JobApproval) {
    const status = jobModerationStatus(job);
    return (
      <div className="approval-row-actions" role="group" aria-label={`Thao tác với ${job.title}`}>
        <button
          type="button"
          className="admin-secondary-action"
          onClick={() => choose(job)}
          aria-label={`Xem tin ${job.title}`}
        >
          <Eye size={16} aria-hidden="true" />
          Xem
        </button>
        {status === "pending" && (
          <>
            <button
              type="button"
              className="admin-primary-action"
              aria-label={`Duyệt tin ${job.title}`}
              onClick={() => {
                decide("approved", job);
                heading.current?.focus();
              }}
            >
              <Check size={16} aria-hidden="true" />
              Duyệt
            </button>
            <button
              type="button"
              className="approval-outline-danger"
              aria-label={`Từ chối tin ${job.title}`}
              onClick={() => {
                choose(job);
                setRejecting(true);
              }}
            >
              <X size={16} aria-hidden="true" />
              Từ chối
            </button>
          </>
        )}
        {status === "approved" && (
          <button
            type="button"
            className="admin-secondary-action"
            onClick={() => openVisibility(job)}
            aria-label={`${job.visibility === "HIDDEN" ? "Công khai lại" : "Ẩn tin"} ${job.title}`}
          >
            {job.visibility === "HIDDEN" ? (
              <Eye size={16} aria-hidden="true" />
            ) : (
              <EyeOff size={16} aria-hidden="true" />
            )}
            {job.visibility === "HIDDEN" ? "Công khai lại" : "Ẩn tin"}
          </button>
        )}
      </div>
    );
  }
  return (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div className="job-approvals">
        {selected && (
          <button
            type="button"
            className="admin-text-link approval-back"
            onClick={() => {
              setSelectedId(null);
              resetDecision();
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Quay lại danh sách
          </button>
        )}
        <div className="admin-page-heading">
          <div>
            <h1 ref={heading} tabIndex={-1}>
              {selected ? selected.title : "Quản lý tin tuyển dụng"}
            </h1>
            <p>
              {selected
                ? selected.companyName
                : "Phê duyệt tin mới, theo dõi tin đang đăng và quản lý hiển thị tại một nơi."}
            </p>
          </div>
          <button type="button" className="admin-secondary-action" onClick={refresh}>
            <RotateCcw size={16} aria-hidden="true" />
            Tải lại
          </button>
        </div>
        <div className="admin-dashboard-source" role="note">
          <Info size={18} aria-hidden="true" />
          <p>
            Danh sách dùng tin trong workspace công ty đã xác thực trên trình duyệt này. Quyết định
            chưa đồng bộ giữa các thiết bị.
          </p>
        </div>
        {notice && (
          <p className="approval-notice" role="status">
            {notice}
          </p>
        )}
        {(error || actionError) && (
          <p className="approval-error" role="alert">
            {error || actionError}{" "}
            <button type="button" className="admin-text-link" onClick={refresh}>
              Tải lại danh sách
            </button>
          </p>
        )}
        {!ready ? (
          <p className="admin-list-state" role="status">
            Đang tải tin tuyển dụng…
          </p>
        ) : user?.role !== "ADMIN" ? (
          <p role="alert">Bạn cần đăng nhập tài khoản quản trị viên để phê duyệt tin.</p>
        ) : selected ? (
          <>
            <article className="admin-panel approval-detail" aria-label="Chi tiết tin tuyển dụng">
              <div className="approval-detail-heading">
                <h2>Thông tin nhà tuyển dụng gửi</h2>
                <StatusBadge job={selected} />
              </div>
              <dl className="approval-facts">
                {[
                  ["Chức danh", selected.title],
                  ["Doanh nghiệp", selected.companyName],
                  ["Phòng ban", selected.department],
                  ["Địa điểm", selected.location],
                  ["Mức lương", selected.salary],
                  ["Thời điểm gửi", date(selected.created)],
                  ["Người đăng", selected.authorName],
                  ["Mã số thuế", selected.companyTaxCode],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || "Chưa cung cấp"}</dd>
                  </div>
                ))}
              </dl>
              {jobModerationStatus(selected) === "pending" ? (
                <div className="approval-decision">
                  <h2>Quyết định phê duyệt</h2>
                  <p>
                    Đối chiếu chức danh, địa điểm và mức lương. Chỉ duyệt khi thông tin đã phù hợp;
                    tin từ chối sẽ không xuất hiện với ứng viên.
                  </p>
                  {rejecting ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        decide("rejected");
                      }}
                    >
                      <label htmlFor="approval-reason">
                        Lý do từ chối <span aria-hidden="true">*</span>
                      </label>
                      <textarea
                        id="approval-reason"
                        required
                        autoFocus
                        maxLength={1000}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        aria-describedby="approval-reason-help"
                        placeholder="Nêu rõ thông tin nhà tuyển dụng cần chỉnh sửa…"
                      />
                      <p id="approval-reason-help">
                        Từ 10 đến 1.000 ký tự · {reason.trim().length}/1.000
                      </p>
                      <div className="approval-actions">
                        <button
                          type="button"
                          className="admin-secondary-action"
                          onClick={resetDecision}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="approval-reject"
                          disabled={reason.trim().length < 10}
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="approval-actions">
                      <button
                        type="button"
                        className="admin-secondary-action"
                        onClick={() => setRejecting(true)}
                      >
                        Từ chối tin
                      </button>
                      <button
                        type="button"
                        className="admin-primary-action"
                        onClick={() => decide("approved")}
                      >
                        <Check size={17} aria-hidden="true" />
                        Phê duyệt tin
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="approval-decision">
                  <h2>Kết quả xét duyệt</h2>
                  <p>
                    {selected.reviewedAt
                      ? `Xử lý bởi ${selected.reviewedBy} · ${date(selected.reviewedAt)}`
                      : "Chưa có thông tin người xét duyệt."}
                  </p>
                  {jobModerationStatus(selected) === "approved" && (
                    <>
                      {selected.visibilityUpdatedAt && (
                        <div className="approval-reason">
                          <h3>Lần cập nhật hiển thị gần nhất</h3>
                          <p>{selected.visibilityReason}</p>
                          <p>
                            {selected.visibilityUpdatedBy} · {date(selected.visibilityUpdatedAt)}
                          </p>
                        </div>
                      )}
                      <div className="approval-actions">
                        <button
                          type="button"
                          className="admin-secondary-action"
                          onClick={() => openVisibility(selected)}
                        >
                          {selected.visibility === "HIDDEN" ? (
                            <Eye size={16} aria-hidden="true" />
                          ) : (
                            <EyeOff size={16} aria-hidden="true" />
                          )}
                          {selected.visibility === "HIDDEN" ? "Công khai lại" : "Ẩn tin"}
                        </button>
                      </div>
                    </>
                  )}
                  {selected.rejectionReason && (
                    <div className="approval-reason">
                      <h3>Lý do từ chối</h3>
                      <p>{selected.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          </>
        ) : (
          <>
            <div
              className="approval-filters"
              role="group"
              aria-label="Lọc trạng thái tin tuyển dụng"
            >
              {(Object.keys(labels) as Status[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  aria-pressed={filter === status}
                  onClick={() => {
                    setFilter(status);
                    setNotice("");
                  }}
                >
                  <span>{labels[status]}</span>
                  <span className="approval-count">
                    {jobs.filter((job) => status === "all" || displayStatus(job) === status).length}
                  </span>
                </button>
              ))}
            </div>
            <ListSearch
              value={query}
              onChange={setQuery}
              label="Tìm chức danh, công ty hoặc địa điểm"
              count={filtered.length}
            />
            <section className="admin-panel" aria-label="Danh sách tin tuyển dụng">
              <div className="admin-panel-heading">
                <h2>{labels[filter]}</h2>
                <span className="approval-list-note">Tin tuyển dụng của nhà tuyển dụng</span>
              </div>
              {filtered.length ? (
                <ul className="approval-list">
                  {pagination.items.map((job) => (
                    <li key={job.id}>
                      <div className="approval-job-summary">
                        <button
                          type="button"
                          id={`approval-open-${job.id}`}
                          className="admin-record-name"
                          onClick={() => choose(job)}
                        >
                          {job.title}
                        </button>
                        <p>
                          {job.companyName || "Chưa cung cấp công ty"} ·{" "}
                          {job.department || "Chưa có phòng ban"}
                        </p>
                        <p>
                          {job.location || "Chưa cung cấp địa điểm"} ·{" "}
                          {job.salary || "Chưa cung cấp mức lương"}
                        </p>
                      </div>
                      <div className="approval-job-action">
                        <div className="approval-row-meta">
                          <StatusBadge job={job} />
                          <span>Gửi {date(job.created)}</span>
                        </div>
                        {rowActions(job)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-list-empty">
                  <ClipboardCheck size={32} aria-hidden="true" />
                  <h2>
                    {query
                      ? "Không tìm thấy tin phù hợp"
                      : filter === "pending"
                        ? "Chưa có tin chờ duyệt"
                        : filter === "all"
                          ? "Chưa có tin tuyển dụng"
                          : `Chưa có tin ${labels[filter].toLowerCase()}`}
                  </h2>
                  <p>
                    {query
                      ? "Thử từ khóa khác hoặc xóa tìm kiếm để xem lại danh sách."
                      : "Tin mới gửi từ nhà tuyển dụng sẽ xuất hiện tại đây. Bạn có thể chuyển trạng thái để xem các tin đã xử lý."}
                  </p>
                  {query && (
                    <button type="button" className="admin-text-link" onClick={() => setQuery("")}>
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              )}
            </section>
            <AdminPagination
              totalItems={filtered.length}
              page={pagination.page}
              onPageChange={pagination.onPageChange}
              itemLabel="tin tuyển dụng"
            />
          </>
        )}
        <Dialog
          open={Boolean(visibilityTarget)}
          onOpenChange={(open) => {
            if (!open) setVisibilityTarget(null);
          }}
        >
          <DialogContent
            className="approval-visibility-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              heading.current?.focus();
            }}
          >
            <DialogTitle>
              {visibilityTarget?.visibility === "HIDDEN"
                ? "Công khai lại tin"
                : "Ẩn tin tuyển dụng"}
            </DialogTitle>
            <DialogDescription>
              {visibilityTarget?.title}.{" "}
              {visibilityTarget?.visibility === "HIDDEN"
                ? "Ứng viên có thể xem và ứng tuyển lại sau thao tác này."
                : "Ứng viên sẽ không thể xem hoặc ứng tuyển tin này sau khi ẩn."}
            </DialogDescription>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                changeVisibility();
              }}
            >
              <label htmlFor="visibility-reason">
                Lý do {visibilityTarget?.visibility === "HIDDEN" ? "công khai lại" : "ẩn tin"}
              </label>
              <textarea
                id="visibility-reason"
                required
                maxLength={1000}
                value={visibilityReason}
                onChange={(event) => setVisibilityReason(event.target.value)}
                aria-describedby="visibility-hint"
                placeholder="Nhập lý do để lưu cùng thao tác xử lý…"
              />
              <p id="visibility-hint">Từ 10 đến 1.000 ký tự.</p>
              {visibilityError && (
                <p className="approval-error" role="alert">
                  {visibilityError}
                </p>
              )}
              <div className="approval-actions">
                <button
                  type="button"
                  className="admin-secondary-action"
                  onClick={() => setVisibilityTarget(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={visibilityReason.trim().length < 10}
                  className={
                    visibilityTarget?.visibility === "HIDDEN"
                      ? "admin-primary-action"
                      : "approval-reject"
                  }
                >
                  {visibilityTarget?.visibility === "HIDDEN"
                    ? "Xác nhận công khai lại"
                    : "Xác nhận ẩn tin"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
