import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { staffJobStatusLabels } from "@/lib/staff-job-copy";
import {
  getStaffJobPublication,
  getStaffJobReview,
  hideStaffJob,
  postingError,
  type StaffJobPublication,
  type StaffJobReview,
} from "@/services/staffJobs";
import { StaffStatusBadge } from "./StaffStatusBadge";

export function StaffJobPublicationControls({
  review,
  scope,
  disabled,
  onBusyChange,
}: {
  review: StaffJobReview;
  scope: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const cache = useQueryClient();
  const key = ["staff-job-publication", scope, review.jobId];
  const publication = useQuery({
    queryKey: key,
    queryFn: () => getStaffJobPublication(review.jobId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const [confirmed, setConfirmed] = useState<StaffJobReview | null>(null);
  const [live, setLive] = useState<StaffJobPublication | null>(null);
  const [suspended, setSuspended] = useState(false);
  const count = Array.from(reason.trim()).length;
  const eligible =
    confirmed &&
    live?.publicationStatus === "PUBLISHED" &&
    confirmed.companyVerified &&
    !confirmed.companySuspended;

  function working(value: boolean) {
    pending.current = value;
    setBusy(value);
    onBusyChange(value);
  }
  async function inspect() {
    if (pending.current || disabled) return;
    working(true);
    setOpen(true);
    setError(null);
    setConfirmed(null);
    setLive(null);
    try {
      const [fresh, current] = await Promise.all([
        getStaffJobReview(review.id),
        getStaffJobPublication(review.jobId),
      ]);
      setConfirmed(fresh);
      setLive(current);
      cache.setQueryData(["staff-job-review", scope, review.id], fresh);
      cache.setQueryData(key, current);
    } catch (caught) {
      setError(caught);
    } finally {
      working(false);
    }
  }
  async function suspend() {
    if (pending.current || disabled || !confirmed || !eligible || count < 1 || count > 1000) return;
    working(true);
    setError(null);
    try {
      const result = await hideStaffJob(confirmed, reason);
      cache.setQueriesData<StaffJobReview>({ queryKey: ["staff-job-review", scope] }, (existing) =>
        existing?.jobId === review.jobId
          ? {
              ...existing,
              publicationStatus: result.publicationStatus,
              jobVersion: result.jobVersion,
            }
          : existing,
      );
      cache.setQueryData(key, { ...live!, publicationStatus: result.publicationStatus });
      cache.removeQueries({
        predicate: (q) =>
          ["public-job", "public-jobs", "public-job-search", "job-published"].includes(
            String(q.queryKey[0]),
          ),
      });
      setSuspended(true);
      setOpen(false);
      setReason("");
      void cache.invalidateQueries({ queryKey: ["staff-job-reviews", scope] });
      void cache.invalidateQueries({ queryKey: ["staff-job-history", scope, review.jobId] });
      void cache.invalidateQueries({ queryKey: ["staff-posting-history", scope, review.jobId] });
      void cache.invalidateQueries({ queryKey: ["staff-activities"] });
    } catch (caught) {
      setError(caught);
      // A conflict or lost response requires another inspection, never an automatic retry.
      setConfirmed(null);
    } finally {
      working(false);
    }
  }
  const status = publication.data?.publicationStatus;
  return (
    <section className="staff-publication-controls" aria-labelledby="staff-publication-title">
      <h2 id="staff-publication-title">Trạng thái đăng tin</h2>
      {suspended && (
        <p role="status" className="staff-publication-receipt">
          Đã đình chỉ tin tuyển dụng. Tin không còn hiển thị công khai.
        </p>
      )}
      {publication.isFetching ? (
        <p role="status">Đang kiểm tra trạng thái đăng tin…</p>
      ) : publication.isError ? (
        <div>
          <p role="alert">Không thể kiểm tra trạng thái đăng tin.</p>
          <button
            className="admin-text-link"
            disabled={disabled || busy}
            onClick={() => void publication.refetch()}
          >
            Thử lại trạng thái đăng tin
          </button>
        </div>
      ) : (
        <>
          <StaffStatusBadge
            tone={
              status === "PUBLISHED" ? "verified" : status === "SUSPENDED" ? "rejected" : "neutral"
            }
            icon
          >
            {status === "PUBLISHED"
              ? "Đang công khai"
              : status === "SUSPENDED"
                ? "Đã đình chỉ"
                : status
                  ? staffJobStatusLabels[status]
                  : "Không có tin công khai"}
          </StaffStatusBadge>
          {status === "PUBLISHED" && (
            <>
              {publication.data?.content.title !== review.content.title && (
                <p>Tin đang công khai: {publication.data?.content.title}</p>
              )}
              <p>
                Đình chỉ sẽ dừng hiển thị công khai của tin #{review.jobId}, không thay đổi kết quả
                xét duyệt phiên bản.
              </p>
              <button
                className="admin-secondary-action job-reject-action"
                disabled={disabled || busy}
                onClick={() => void inspect()}
              >
                <ShieldOff size={16} aria-hidden="true" /> Đình chỉ tin tuyển dụng
              </button>
            </>
          )}
        </>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent
          className="admin-decision-dialog staff-suspend-dialog"
          hideClose={busy}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>Đình chỉ tin tuyển dụng</DialogTitle>
          <DialogDescription>
            Tin #{review.jobId} sẽ không còn hiển thị công khai. Ghi rõ lý do trước khi xác nhận.
          </DialogDescription>
          {live?.content.title && <p className="staff-suspend-target">{live.content.title}</p>}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void suspend();
            }}
          >
            <label htmlFor="staff-suspend-reason">Lý do đình chỉ</label>
            <textarea
              id="staff-suspend-reason"
              rows={4}
              value={reason}
              required
              disabled={busy}
              aria-describedby="staff-suspend-count"
              onChange={(event) => setReason(event.target.value)}
            />
            <p id="staff-suspend-count" className="admin-form-hint" aria-live="polite">
              {count}/1.000 ký tự · Tối thiểu 1 ký tự.
            </p>
            {busy && (
              <p role="status">
                {confirmed ? "Đang đình chỉ tin…" : "Đang kiểm tra tin mới nhất…"}
              </p>
            )}
            {Boolean(error) && (
              <p role="alert" className="compliance-action-error">
                {postingError(error)}
              </p>
            )}
            {confirmed && !eligible && (
              <p role="status">
                Tin hiện không đủ điều kiện đình chỉ. Chỉ tin đang công khai của công ty đã xác
                minh, không bị đình chỉ mới có thể xử lý.
              </p>
            )}
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="admin-secondary-action"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Hủy
              </button>
              {!confirmed && !busy ? (
                <button
                  type="button"
                  className="admin-primary-action"
                  onClick={() => void inspect()}
                >
                  Tải lại trạng thái tin
                </button>
              ) : (
                <button
                  type="submit"
                  className="admin-primary-action staff-suspend-confirm"
                  disabled={busy || disabled || !eligible || count < 1 || count > 1000}
                >
                  Xác nhận đình chỉ
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
