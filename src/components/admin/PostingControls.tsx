import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/services/api";
import { jobStatusLabels } from "@/services/jobs";
import {
  getPostingHistory,
  getStaffJobReview,
  hideStaffJob,
  postingError,
  type StaffJobReview,
} from "@/services/staffJobs";

export function PostingControls({ review, scope }: { review: StaffJobReview; scope: string }) {
  const cache = useQueryClient();
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [confirmedReview, setConfirmedReview] = useState<StaffJobReview | null>(null);
  const [hidden, setHidden] = useState(false);
  const history = useQuery({
    queryKey: ["staff-posting-history", scope, review.jobId, page],
    queryFn: () => getPostingHistory(review.jobId, page),
    retry: false,
  });
  const current = confirmedReview ?? review;
  const eligible = !hidden && current.publicationStatus === "PUBLISHED";
  async function inspect() {
    const fresh = await getStaffJobReview(review.id);
    setConfirmedReview(fresh);
    cache.setQueryData(["staff-job-review", scope, review.id], fresh);
    return fresh;
  }
  async function start() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setOpen(true);
    setConfirmedReview(null);
    try {
      await inspect();
    } catch (e) {
      setError(e);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function hide() {
    if (pending.current || !confirmedReview || !eligible || count < 1 || count > 1000) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await hideStaffJob(confirmedReview, reason);
      setHidden(true);
      setOpen(false);
      setReason("");
      cache.setQueryData(["staff-job-review", scope, review.id], {
        ...confirmedReview,
        publicationStatus: result.publicationStatus,
        jobVersion: result.jobVersion,
      });
      // Public content must not remain visible while a refetch is in flight.
      cache.removeQueries({
        predicate: (q) =>
          ["public-job", "public-jobs", "job-published"].includes(String(q.queryKey[0])),
      });
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["staff-posting-history", scope, review.jobId] }),
        cache.invalidateQueries({ queryKey: ["staff-job-reviews", scope] }),
        cache.invalidateQueries({ queryKey: ["publishing-jobs"] }),
      ]);
    } catch (e) {
      setError(e);
      setConfirmedReview(null);
      if (e instanceof ApiError && e.status === 409) {
        try {
          await inspect();
          await history.refetch();
        } catch (reloadError) {
          setError(reloadError);
        }
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const count = Array.from(reason.trim()).length;
  const data = history.data;
  const statusLabel = (status: string | null) =>
    status ? (jobStatusLabels[status as keyof typeof jobStatusLabels] ?? status) : "—";
  return (
    <section className="admin-panel staff-posting-history" aria-labelledby="posting-history-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="posting-history-title">Lịch sử hoạt động của tin #{review.jobId}</h2>
          <p>
            Trạng thái tin:{" "}
            {hidden ? jobStatusLabels.SUSPENDED : statusLabel(current.publicationStatus ?? null)}
          </p>
        </div>
        {eligible && (
          <button
            className="admin-secondary-action job-reject-action"
            disabled={busy}
            onClick={() => void start()}
          >
            Ẩn tin tuyển dụng
          </button>
        )}
      </div>
      {hidden && <p role="status">Đã ẩn tin tuyển dụng.</p>}
      {history.isFetching ? (
        <p role="status">Đang tải lịch sử hoạt động…</p>
      ) : history.isError ? (
        <div>
          <p role="alert">{postingError(history.error)}</p>
          <button className="admin-secondary-action" onClick={() => void history.refetch()}>
            Thử tải lại lịch sử
          </button>
        </div>
      ) : !data?.content.length ? (
        <div className="staff-history-empty">
          <h3>Chưa có lịch sử hoạt động.</h3>
          <p>Các thay đổi trạng thái của tin sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <ol className="staff-event-list">
          {data.content.map((event, index) => (
            <li key={`${event.createdAt}:${index}`} className="staff-event-entry">
              <time className="staff-event-date" dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </time>
              <div className="staff-event-body">
                <p>
                  <strong>
                    {event.eventType === "JOB_SUSPENDED"
                      ? "Đã ẩn tin tuyển dụng · JOB_SUSPENDED"
                      : event.eventType}
                  </strong>
                </p>
                <p>
                  {event.actorUserId === null
                    ? "Hệ thống"
                    : `Người thực hiện #${event.actorUserId}`}
                </p>
                {(event.previousStatus || event.status) && (
                  <p>
                    {statusLabel(event.previousStatus)} → {statusLabel(event.status)}
                  </p>
                )}
                {event.reason && <p className="posting-event-reason">Lý do: {event.reason}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!history.isFetching && !history.isError && data && (
        <nav className="compliance-dialog-actions" aria-label="Phân trang lịch sử hoạt động">
          <span>
            {data.totalElements} sự kiện · Trang {data.totalPages ? data.pageNumber + 1 : 0}/
            {data.totalPages} · {data.pageSize} mỗi trang
          </span>
          <button
            className="admin-secondary-action"
            disabled={data.first}
            onClick={() => setPage(data.pageNumber - 1)}
          >
            Trang trước
          </button>
          <button
            className="admin-secondary-action"
            disabled={data.last}
            onClick={() => setPage(data.pageNumber + 1)}
          >
            Trang sau
          </button>
        </nav>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent
          className="compliance-action-dialog posting-hide-dialog"
          style={{ width: "calc(100vw - 32px)", maxWidth: "512px", minWidth: 0 }}
          onInteractOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogTitle>Ẩn tin tuyển dụng</DialogTitle>
          <DialogDescription>
            Tin #{review.jobId} sẽ không còn hiển thị công khai. Kiểm tra tin và ghi lý do trước khi
            xác nhận.
          </DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void hide();
            }}
          >
            <label htmlFor="posting-hide-reason">Lý do ẩn tin (1–1.000 ký tự)</label>
            <textarea
              id="posting-hide-reason"
              rows={4}
              value={reason}
              disabled={busy}
              required
              aria-describedby="posting-hide-count"
              onChange={(e) => setReason(e.target.value)}
            />
            <p id="posting-hide-count" aria-live="polite">
              {count}/1.000 ký tự sau khi bỏ khoảng trắng đầu và cuối
            </p>
            {Boolean(error) && (
              <p role="alert" className="compliance-action-error">
                {postingError(error)}
              </p>
            )}
            {confirmedReview && !eligible && (
              <p role="status">
                Tin hiện không đủ điều kiện ẩn. Trạng thái:{" "}
                {statusLabel(confirmedReview.publicationStatus ?? null)}.
              </p>
            )}
            <div className="compliance-dialog-actions">
              <button
                type="button"
                className="admin-secondary-action"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Hủy
              </button>
              {!confirmedReview && !busy ? (
                <button type="button" className="admin-primary-action" onClick={() => void start()}>
                  Tải lại bản tin
                </button>
              ) : (
                <button
                  type="submit"
                  className="admin-primary-action"
                  disabled={busy || !confirmedReview || !eligible || count < 1 || count > 1000}
                >
                  {busy ? "Đang xử lý…" : "Xác nhận ẩn tin"}
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
