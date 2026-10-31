import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Eye, RotateCw } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { AdminPagination } from "./AdminPagination";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { JobContentView } from "@/components/recruiter/JobContentEditor";
import { jobStatusLabels, revisionLabels } from "@/services/jobs";
import {
  decideStaffJobReview,
  getStaffJobReview,
  listStaffJobReviews,
  staffJobHistory,
  staffJobError,
  REVIEW_PAGE_SIZE,
  type ReviewFilter,
  type StaffJobReview,
  type StaffDecisionReceipt,
} from "@/services/staffJobs";
import { PostingControls } from "./PostingControls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import "./compliance.css";
import "../recruiter/job-publishing.css";
import "./staff-jobs.css";

const filters: ReviewFilter[] = ["PENDING_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"];
function tone(state: StaffJobReview["state"]): StaffStatusTone {
  return state === "PENDING_REVIEW"
    ? "pending"
    : state === "APPROVED"
      ? "verified"
      : state === "REJECTED"
        ? "rejected"
        : "neutral";
}
function dateTime(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
function ReviewError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="staff-jobs-message">
      <p role="alert">{staffJobError(error)}</p>
      <button className="admin-secondary-action" onClick={retry}>
        Thử tải lại
      </button>
    </div>
  );
}

export function StaffJobsPanel() {
  const user = useAuthUser();
  const scope = String(user?.id);
  const cache = useQueryClient();
  const [status, setStatus] = useState<ReviewFilter>("PENDING_REVIEW");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const list = useQuery({
    queryKey: ["staff-job-reviews", scope, status, page],
    queryFn: () => listStaffJobReviews(status, page),
    enabled: selectedId === null,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (list.data && !list.isFetching && !list.isError && page > 0 && page >= list.data.totalPages)
      setPage(Math.max(0, list.data.totalPages - 1));
  }, [list.data, list.isFetching, list.isError, page]);
  function back() {
    setSelectedId(null);
    void cache.invalidateQueries({ queryKey: ["staff-job-reviews", scope] });
  }
  if (selectedId !== null)
    return (
      <StaffJobDetail
        key={`${scope}:${selectedId}`}
        id={selectedId}
        scope={scope}
        onBack={back}
        onSelect={setSelectedId}
      />
    );
  return (
    <section className="admin-panel compliance-list staff-jobs" aria-labelledby="staff-queue-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="staff-queue-title">Hàng đợi duyệt tin</h2>
          <p>Mỗi dòng là một phiên bản đã gửi duyệt của tin tuyển dụng.</p>
        </div>
        <button
          className="admin-secondary-action"
          disabled={list.isFetching}
          onClick={() => void list.refetch()}
        >
          <RotateCw size={16} aria-hidden="true" /> Tải lại
        </button>
      </div>
      <div className="admin-sample-toolbar">
        <label className="admin-sample-filter">
          Trạng thái
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ReviewFilter);
              setPage(0);
            }}
          >
            {filters.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "ALL" ? "Tất cả phiên bản" : revisionLabels[filter]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {list.isFetching ? (
        <p className="staff-jobs-message" role="status">
          Đang tải danh sách tin…
        </p>
      ) : list.isError ? (
        <ReviewError error={list.error} retry={() => void list.refetch()} />
      ) : !list.data?.content.length ? (
        <div className="compliance-empty" role="status">
          <h3>Không có tin trong mục này</h3>
          <p>Chọn trạng thái khác hoặc tải lại để kiểm tra tin mới.</p>
        </div>
      ) : (
        <div
          className="staff-jobs-table-scroll"
          role="region"
          aria-label="Danh sách phiên bản tin tuyển dụng"
          tabIndex={0}
        >
          <table className="staff-jobs-table">
            <caption className="sr-only">Các phiên bản tin tuyển dụng đã gửi duyệt</caption>
            <thead>
              <tr>
                <th scope="col">Tin tuyển dụng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Điều kiện duyệt</th>
                <th scope="col">Ngày gửi</th>
                <th scope="col">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.data.content.map((review) => (
                <tr key={review.id}>
                  <td className="compliance-job">
                    <button onClick={() => setSelectedId(review.id)}>
                      {review.content.title || "Chưa có chức danh"}
                    </button>
                    <span>
                      Công ty #{review.companyId} · Tin #{review.jobId}
                    </span>
                    <small>
                      Phiên bản {review.revisionNumber} · #{review.id}
                    </small>
                  </td>
                  <td>
                    <StaffStatusBadge tone={tone(review.state)}>
                      {revisionLabels[review.state]}
                    </StaffStatusBadge>
                  </td>
                  <td>
                    {review.state !== "PENDING_REVIEW"
                      ? "Đã kết thúc xét duyệt"
                      : review.approvalEligible
                        ? "Đủ điều kiện"
                        : "Cần kiểm tra điều kiện"}
                  </td>
                  <td>
                    <time dateTime={review.submittedAt ?? undefined}>
                      {dateTime(review.submittedAt)}
                    </time>
                  </td>
                  <td>
                    <button
                      className="admin-sample-detail-button"
                      aria-label={`Xem chi tiết ${review.content.title || `phiên bản ${review.id}`}`}
                      onClick={() => setSelectedId(review.id)}
                    >
                      <Eye size={16} aria-hidden="true" /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!list.isFetching && !list.isError && list.data && (
        <AdminPagination
          totalItems={list.data.totalElements}
          page={page}
          pageSize={REVIEW_PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="phiên bản"
          label="Phân trang tin tuyển dụng"
        />
      )}
    </section>
  );
}

function StaffJobDetail({
  id,
  scope,
  onBack,
  onSelect,
}: {
  id: number;
  scope: string;
  onBack: () => void;
  onSelect: (id: number) => void;
}) {
  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus({ preventScroll: true });
  }, []);
  const cache = useQueryClient();
  const [historyPage, setHistoryPage] = useState(0);
  const [detailTab, setDetailTab] = useState("content");
  const [outcome, setOutcome] = useState<StaffDecisionReceipt["outcome"] | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [mustReload, setMustReload] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [receipt, setReceipt] = useState<StaffDecisionReceipt | null>(null);
  const detail = useQuery({
    queryKey: ["staff-job-review", scope, id],
    queryFn: () => getStaffJobReview(id),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
  });
  const review = detail.data;
  const history = useQuery({
    queryKey: ["staff-job-history", scope, review?.jobId, historyPage],
    queryFn: () => staffJobHistory(review!.jobId, historyPage),
    enabled: Boolean(review),
    retry: false,
    refetchOnWindowFocus: false,
  });
  async function reload() {
    if (busyRef.current) return;
    const result = await detail.refetch();
    if (result.isSuccess) {
      setMustReload(false);
      setError(null);
      setOutcome(null);
    }
    void history.refetch();
    void cache.invalidateQueries({ queryKey: ["staff-job-reviews", scope] });
  }
  async function decide() {
    if (!review || !outcome || busyRef.current || mustReload || detail.isFetching) return;
    if (outcome === "REJECTED" && Array.from(reason.trim()).length < 10) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await decideStaffJobReview(review, outcome, reason);
      setReceipt(result);
      setOutcome(null);
      setReason("");
      setMustReload(true);
      const refreshed = await detail.refetch();
      if (refreshed.isSuccess) setMustReload(false);
      await cache.invalidateQueries({ queryKey: ["staff-job-history", scope, review.jobId] });
      await cache.invalidateQueries({ queryKey: ["staff-job-reviews", scope] });
    } catch (caught) {
      setError(caught);
      setMustReload(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const locked = busy || mustReload || detail.isFetching || detail.isError;
  return (
    <div className="staff-jobs staff-job-detail">
      <button className="admin-text-link compliance-back" disabled={busy} onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Quay lại danh sách
      </button>
      {receipt && (
        <p className="compliance-notice" role="status">
          <Check size={17} aria-hidden="true" />
          {receipt.outcome === "APPROVED"
            ? `Đã duyệt phiên bản. Trạng thái tin: ${jobStatusLabels[receipt.publicationStatus]}.`
            : "Đã từ chối phiên bản và lưu lý do."}
        </p>
      )}
      {detail.isFetching ? (
        <p role="status" className="staff-jobs-message">
          Đang tải bản tin…
        </p>
      ) : detail.isError ? (
        <ReviewError error={detail.error} retry={() => void reload()} />
      ) : (
        review && (
          <>
            <div className="admin-page-heading">
              <div>
                <h2 className="job-detail-title" tabIndex={-1} ref={focusHeading}>
                  {review.content.title || "Chi tiết tin tuyển dụng"}
                </h2>
                <p>
                  Tin #{review.jobId} · Công ty #{review.companyId} · Phiên bản{" "}
                  {review.revisionNumber}
                </p>
              </div>
              <button
                className="admin-secondary-action"
                disabled={busy}
                onClick={() => void reload()}
              >
                <RotateCw size={16} aria-hidden="true" /> Tải lại bản tin
              </button>
            </div>
            <Tabs value={detailTab} onValueChange={setDetailTab} className="staff-detail-tabs">
              <div className="staff-detail-tab-scroll">
                <TabsList
                  onFocusCapture={(event) => {
                    if (event.target instanceof HTMLElement)
                      event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
                  }}
                  className="staff-detail-tab-list"
                  aria-label="Chi tiết tin tuyển dụng"
                >
                  <TabsTrigger value="content">Nội dung và điều kiện</TabsTrigger>
                  <TabsTrigger value="activity">Hoạt động và trạng thái</TabsTrigger>
                  <TabsTrigger value="revisions">Lịch sử phiên bản</TabsTrigger>
                </TabsList>
              </div>
              <div className="compliance-detail-layout" data-detail-tab={detailTab}>
                <div className="staff-detail-tab-panels">
                  <TabsContent value="content" forceMount>
                    <section
                      className="admin-panel compliance-jd"
                      aria-labelledby="review-content-title"
                    >
                      <div className="admin-panel-heading">
                        <h2 id="review-content-title">Nội dung gửi duyệt</h2>
                        <StaffStatusBadge tone={tone(review.state)}>
                          {revisionLabels[review.state]}
                        </StaffStatusBadge>
                      </div>
                      <div className="staff-jobs-content">
                        <JobContentView content={review.content} />
                      </div>
                    </section>
                  </TabsContent>
                  <TabsContent value="activity" forceMount>
                    <PostingControls review={review} scope={scope} />
                  </TabsContent>
                  <TabsContent value="revisions" forceMount>
                    <section
                      className="admin-panel staff-jobs-history"
                      aria-labelledby="review-history-title"
                    >
                      <div className="admin-panel-heading">
                        <div>
                          <h2 id="review-history-title">
                            Lịch sử phiên bản của tin #{review.jobId}
                          </h2>
                          <p>Phiên bản đã duyệt không đồng nghĩa với tin đang công khai.</p>
                        </div>
                      </div>
                      {history.isFetching ? (
                        <p role="status" className="staff-jobs-message">
                          Đang tải lịch sử…
                        </p>
                      ) : history.isError ? (
                        <ReviewError error={history.error} retry={() => void history.refetch()} />
                      ) : history.data?.content.length ? (
                        <ol>
                          {history.data.content.map((item) => (
                            <li
                              key={item.id}
                              className="staff-revision-entry"
                              aria-current={item.id === id ? "true" : undefined}
                            >
                              <div className="staff-revision-heading">
                                <button
                                  className="admin-text-link"
                                  disabled={busy || item.id === id}
                                  aria-label={`Xem phiên bản ${item.revisionNumber}`}
                                  onClick={() => onSelect(item.id)}
                                >
                                  Phiên bản {item.revisionNumber}
                                </button>
                                <StaffStatusBadge tone={tone(item.state)}>
                                  {revisionLabels[item.state]}
                                </StaffStatusBadge>
                                {item.id === id && (
                                  <span className="staff-revision-current">Đang xem</span>
                                )}
                              </div>
                              <p>
                                Gửi: {dateTime(item.submittedAt)} · Người gửi:{" "}
                                {item.submitterUserId ?? "Chưa có"}
                              </p>
                              {item.decidedAt && (
                                <p>
                                  Quyết định: {dateTime(item.decidedAt)} · Người duyệt:{" "}
                                  {item.reviewerUserId ?? "Chưa có"}
                                </p>
                              )}
                              {item.withdrawnAt && (
                                <p>
                                  Đã rút: {dateTime(item.withdrawnAt)} · Người rút:{" "}
                                  {item.withdrawerUserId ?? "Chưa có"}
                                </p>
                              )}
                              {item.rejectionReason && (
                                <p className="posting-event-reason">
                                  Lý do từ chối: {item.rejectionReason}
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="staff-jobs-message">Chưa có lịch sử phiên bản.</p>
                      )}
                      {!history.isFetching && !history.isError && history.data && (
                        <AdminPagination
                          totalItems={history.data.totalElements}
                          page={historyPage}
                          pageSize={REVIEW_PAGE_SIZE}
                          onPageChange={setHistoryPage}
                          itemLabel="phiên bản"
                          label="Phân trang lịch sử phiên bản"
                        />
                      )}
                    </section>
                  </TabsContent>
                </div>
                <aside className="compliance-inspector">
                  <section
                    className="admin-panel staff-jobs-eligibility"
                    aria-labelledby="review-eligibility-title"
                  >
                    <h2 id="review-eligibility-title">Điều kiện xét duyệt</h2>
                    <ul className="staff-review-conditions">
                      <li>
                        <span>Công ty</span>
                        <StaffStatusBadge tone={review.companyVerified ? "verified" : "pending"}>
                          {review.companyVerified ? "Đã xác thực" : "Chưa xác thực"}
                        </StaffStatusBadge>
                      </li>
                      <li>
                        <span>Đình chỉ công ty</span>
                        <StaffStatusBadge tone={review.companySuspended ? "rejected" : "verified"}>
                          {review.companySuspended ? "Có" : "Không"}
                        </StaffStatusBadge>
                      </li>
                      <li>
                        <span>Người phụ trách</span>
                        <StaffStatusBadge tone={review.needsReassignment ? "pending" : "verified"}>
                          {review.needsReassignment ? "Cần phân công lại" : "Đã có"}
                        </StaffStatusBadge>
                      </li>
                    </ul>
                    {!!review.validationIssues.length && (
                      <>
                        <h3>Nội dung cần kiểm tra</h3>
                        <ul>
                          {review.validationIssues.map((issue, index) => (
                            <li key={index}>
                              {issue.field}: {issue.code}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {review.state === "PENDING_REVIEW" && !review.approvalEligible && (
                      <p>
                        Chưa đủ điều kiện phê duyệt. Kiểm tra các điều kiện và nội dung trước khi
                        tải lại bản tin.
                      </p>
                    )}
                  </section>
                  <section
                    className="admin-panel compliance-handling"
                    aria-labelledby="review-actions-title"
                  >
                    <h2 id="review-actions-title">Xử lý tin tuyển dụng</h2>
                    <StaffStatusBadge tone={tone(review.state)}>
                      {revisionLabels[review.state]}
                    </StaffStatusBadge>
                    {review.state === "PENDING_REVIEW" && (
                      <p>
                        {review.approvalEligible
                          ? "Đủ điều kiện phê duyệt."
                          : "Cần kiểm tra điều kiện trước khi phê duyệt."}
                      </p>
                    )}
                    <p>Đã gửi: {dateTime(review.submittedAt)}</p>
                    {review.state === "PENDING_REVIEW" ? (
                      <div>
                        <button
                          className="admin-primary-action"
                          disabled={locked || !review.approvalEligible}
                          onClick={() => {
                            setError(null);
                            setOutcome("APPROVED");
                          }}
                        >
                          <Check size={16} aria-hidden="true" /> Đồng ý đăng tin
                        </button>
                        <button
                          className="admin-secondary-action job-reject-action"
                          disabled={locked}
                          onClick={() => {
                            setError(null);
                            setOutcome("REJECTED");
                          }}
                        >
                          Từ chối đăng tin
                        </button>
                      </div>
                    ) : (
                      <p>Phiên bản đã kết thúc xét duyệt. Quyết định không thể thay đổi tại đây.</p>
                    )}
                    {mustReload && (
                      <p role="alert">
                        Cần tải lại bản tin để xác nhận trạng thái trước khi tiếp tục.
                      </p>
                    )}
                    {review.rejectionReason && <p>Lý do từ chối: {review.rejectionReason}</p>}
                  </section>
                </aside>
              </div>
            </Tabs>
          </>
        )
      )}
      <Dialog
        open={Boolean(outcome)}
        onOpenChange={(open) => {
          if (!open && !busy) setOutcome(null);
        }}
      >
        <DialogContent
          className="compliance-action-dialog"
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>
            {outcome === "APPROVED" ? "Đồng ý đăng tin" : "Từ chối đăng tin"}
          </DialogTitle>
          <DialogDescription className="compliance-action-description">
            {review?.content.title} · Phiên bản {review?.revisionNumber}. Quyết định được lưu lên hệ
            thống.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void decide();
            }}
          >
            <label htmlFor="staff-review-reason">
              {outcome === "REJECTED"
                ? "Lý do từ chối (10–1.000 ký tự)"
                : "Ghi chú (không bắt buộc)"}
            </label>
            <textarea
              id="staff-review-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required={outcome === "REJECTED"}
              maxLength={1000}
              rows={4}
              disabled={busy}
            />
            {Boolean(error) && (
              <p className="compliance-action-error" role="alert">
                {staffJobError(error)}
              </p>
            )}
            <div className="compliance-dialog-actions">
              <button
                type="button"
                className="admin-secondary-action"
                disabled={busy}
                onClick={() => setOutcome(null)}
              >
                Hủy
              </button>
              {mustReload ? (
                <button
                  type="button"
                  className="admin-primary-action"
                  onClick={() => void reload()}
                >
                  Tải lại bản tin
                </button>
              ) : (
                <button
                  className="admin-primary-action"
                  type="submit"
                  disabled={
                    locked ||
                    (outcome === "APPROVED" && !review?.approvalEligible) ||
                    (outcome === "REJECTED" && Array.from(reason.trim()).length < 10)
                  }
                >
                  {busy
                    ? "Đang lưu…"
                    : outcome === "APPROVED"
                      ? "Xác nhận đồng ý đăng tin"
                      : "Xác nhận từ chối đăng tin"}
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
