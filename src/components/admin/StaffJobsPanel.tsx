import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Eye, RotateCw } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { AdminPagination } from "./AdminPagination";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { JobContentView } from "@/components/recruiter/JobContentView";
import { revisionLabels } from "@/services/jobs";
import { staffJobIssueLabel, staffJobStatusLabels } from "@/lib/staff-job-copy";
import { reviewJobContent } from "@/lib/job-legal-review";
import { useTableSort } from "@/hooks/useTableSort";
import { StaffDetailNotice } from "./StaffDetailNotice";
import { StaffJobPublicationControls } from "./StaffJobPublicationControls";
import { StaffJobPostingStatus, StaffJobPostingStatusBadge } from "./StaffJobPostingStatus";
import { useStaffJobPublication } from "@/hooks/useStaffJobPublication";
import { sortDate } from "@/lib/table-sort";
import { SortableHeader } from "./SortableHeader";
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
import { JobLegalReview } from "./JobLegalReview";
import "./compliance.css";
import "../recruiter/job-publishing.css";
import "./staff-jobs.css";
import "./staff-job-detail.css";

const filters: ReviewFilter[] = ["PENDING_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"];
function tone(state: StaffJobReview["state"]): StaffStatusTone {
  return state === "PENDING_REVIEW"
    ? "pending"
    : state === "APPROVED"
      ? "verified"
      : state === "REJECTED"
        ? "rejected"
        : state === "WITHDRAWN"
          ? "purple"
          : "neutral";
}
function dateTime(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
function approvalLabel(review: StaffJobReview) {
  return review.state !== "PENDING_REVIEW"
    ? "Đã kết thúc xét duyệt"
    : review.approvalEligible
      ? "Có thể phê duyệt"
      : "Chưa thể phê duyệt";
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
  const queueSort = useTableSort(
    list.data?.content ?? [],
    {
      title: (row) => row.content.title,
      state: (row) => revisionLabels[row.state],
      eligibility: approvalLabel,
      submittedAt: (row) => sortDate(row.submittedAt),
    },
    { key: "submittedAt", direction: "desc" },
    `${scope}:${status}`,
  );
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
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý tin tuyển dụng</h1>
          <p>Xét duyệt tin tuyển dụng và đối chiếu các dấu hiệu AI với căn cứ pháp luật.</p>
        </div>
      </div>
      <section
        className="admin-panel compliance-list staff-jobs"
        aria-labelledby="staff-queue-title"
      >
        <div className="admin-panel-heading">
          <div>
            <h2 id="staff-queue-title">Hàng đợi duyệt tin</h2>
            <p>Mỗi dòng là một phiên bản đã gửi duyệt của tin tuyển dụng.</p>
          </div>
          <button
            className="admin-secondary-action"
            disabled={list.isFetching}
            onClick={() => {
              void list.refetch();
              void cache.invalidateQueries({ queryKey: ["staff-job-publication", scope] });
            }}
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
                  <SortableHeader label="Tin tuyển dụng" column="title" {...queueSort} />
                  <th scope="col">Trạng thái đăng tin</th>
                  <SortableHeader label="Xét duyệt phiên bản" column="state" {...queueSort} />
                  <SortableHeader label="Điều kiện duyệt" column="eligibility" {...queueSort} />
                  <SortableHeader label="Ngày gửi" column="submittedAt" {...queueSort} />
                  <th scope="col">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {queueSort.rows.map((review) => (
                  <tr key={review.id}>
                    <td className="compliance-job">
                      <button onClick={() => setSelectedId(review.id)}>
                        {review.content.title || "Chưa có chức danh"}
                      </button>
                      <span>
                        Công ty #{review.companyId} · Tin #{review.jobId} · Phiên bản{" "}
                        {review.revisionNumber} · #{review.id}
                      </span>
                    </td>
                    <td>
                      <StaffJobPostingStatus scope={scope} jobId={review.jobId} />
                    </td>
                    <td>
                      <StaffStatusBadge tone={tone(review.state)} icon>
                        {revisionLabels[review.state]}
                      </StaffStatusBadge>
                    </td>
                    <td>{approvalLabel(review)}</td>
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
    </>
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
    if (!node) return;
    node.closest("main")?.scrollTo({ top: 0, behavior: "auto" });
    node.focus({ preventScroll: true });
  }, []);
  const cache = useQueryClient();
  const [historyPage, setHistoryPage] = useState(0);
  const [outcome, setOutcome] = useState<StaffDecisionReceipt["outcome"] | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [publicationBusy, setPublicationBusy] = useState(false);
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
  const publication = useStaffJobPublication(scope, review?.jobId);
  const legalFindings = review ? reviewJobContent(review.content) : [];
  const history = useQuery({
    queryKey: ["staff-job-history", scope, review?.jobId, historyPage],
    queryFn: () => staffJobHistory(review!.jobId, historyPage),
    enabled: Boolean(review),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const historySort = useTableSort(
    history.data?.content ?? [],
    {
      revisionNumber: (row) => row.revisionNumber,
      state: (row) => revisionLabels[row.state],
      submittedAt: (row) => sortDate(row.submittedAt),
      decidedAt: (row) => sortDate(row.decidedAt ?? row.withdrawnAt),
    },
    { key: "revisionNumber", direction: "desc" },
    `${scope}:${review?.jobId}`,
  );
  async function reload() {
    if (busyRef.current) return;
    const result = await detail.refetch();
    if (result.isSuccess) {
      setMustReload(false);
      setError(null);
      setOutcome(null);
    }
    void history.refetch();
    void publication.refetch();
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
      await cache.invalidateQueries({ queryKey: ["staff-job-publication", scope, review.jobId] });
    } catch (caught) {
      setError(caught);
      setMustReload(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const locked = busy || publicationBusy || mustReload || detail.isFetching || detail.isError;
  return (
    <div className="staff-jobs staff-job-detail">
      <button
        className="admin-text-link compliance-back"
        disabled={busy || publicationBusy}
        onClick={onBack}
      >
        <ArrowLeft size={16} aria-hidden="true" /> Quay lại danh sách
      </button>
      {receipt && (
        <p className="compliance-notice" role="status">
          <Check size={17} aria-hidden="true" />
          {receipt.outcome === "APPROVED"
            ? `Đã duyệt phiên bản. Trạng thái tin: ${staffJobStatusLabels[receipt.publicationStatus]}.`
            : "Đã từ chối phiên bản và lưu lý do."}
        </p>
      )}
      {(detail.isFetching || detail.isError) && (
        <div className="admin-page-heading">
          <h1>Chi tiết tin tuyển dụng</h1>
        </div>
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
            <div className="admin-page-heading staff-job-object-heading">
              <div>
                <h1 className="job-detail-title" tabIndex={-1} ref={focusHeading}>
                  {review.content.title || "Chi tiết tin tuyển dụng"}
                </h1>
                <p>
                  Tin #{review.jobId} · Công ty #{review.companyId} · Phiên bản{" "}
                  {review.revisionNumber}
                </p>
                <div className="staff-job-heading-status">
                  <span>Trạng thái đăng tin</span>
                  <StaffJobPostingStatusBadge publication={publication} />
                </div>
              </div>
              <button
                className="admin-secondary-action"
                disabled={busy || publicationBusy}
                onClick={() => void reload()}
              >
                <RotateCw size={16} aria-hidden="true" /> Tải lại bản tin
              </button>
            </div>
            {!publication.isError &&
              !publication.isFetching &&
              publication.data?.publicationStatus === "SUSPENDED" && (
                <StaffDetailNotice title="Tin tuyển dụng đã bị đình chỉ" tone="danger">
                  <p>
                    Tin không hiển thị cho ứng viên. Kết quả xét duyệt phiên bản được giữ nguyên;
                    chỉ thao tác khôi phục tin đủ điều kiện mới đăng lại tin công khai.
                  </p>
                </StaffDetailNotice>
              )}
            <div className="compliance-detail-layout staff-job-review-layout">
              <div className="staff-job-review-content">
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
                    <JobContentView content={review.content} showTitle={false} />
                  </div>
                </section>
                <section
                  id="staff-job-revision-history"
                  className="admin-panel staff-jobs-history"
                  aria-labelledby="review-history-title"
                >
                  <div className="admin-panel-heading">
                    <div>
                      <h2 id="review-history-title">Lịch sử phiên bản của tin #{review.jobId}</h2>
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
                    <div
                      className="staff-revision-table-scroll"
                      role="region"
                      aria-label="Các phiên bản của tin tuyển dụng"
                      tabIndex={0}
                    >
                      <table className="admin-record-table staff-revision-table">
                        <caption className="sr-only">Các phiên bản đã gửi duyệt</caption>
                        <thead>
                          <tr>
                            <SortableHeader
                              label="Phiên bản"
                              column="revisionNumber"
                              {...historySort}
                            />
                            <SortableHeader label="Trạng thái" column="state" {...historySort} />
                            <SortableHeader
                              label="Gửi duyệt"
                              column="submittedAt"
                              {...historySort}
                            />
                            <SortableHeader label="Xét duyệt" column="decidedAt" {...historySort} />
                          </tr>
                        </thead>
                        <tbody>
                          {historySort.rows.map((item) => (
                            <Fragment key={item.id}>
                              <tr aria-current={item.id === id ? "true" : undefined}>
                                <td>
                                  <button
                                    className="admin-text-link"
                                    disabled={busy || publicationBusy || item.id === id}
                                    aria-label={`Xem phiên bản ${item.revisionNumber}`}
                                    onClick={() => onSelect(item.id)}
                                  >
                                    Phiên bản {item.revisionNumber}
                                  </button>
                                  {item.id === id && (
                                    <small className="staff-revision-current">Đang xem</small>
                                  )}
                                </td>
                                <td>
                                  <StaffStatusBadge tone={tone(item.state)} icon>
                                    {revisionLabels[item.state]}
                                  </StaffStatusBadge>
                                </td>
                                <td>
                                  <time dateTime={item.submittedAt ?? undefined}>
                                    {dateTime(item.submittedAt)}
                                  </time>
                                  <small>Người gửi: {item.submitterUserId ?? "Chưa có"}</small>
                                </td>
                                <td>
                                  {item.withdrawnAt ? (
                                    <>
                                      <span>Đã rút: {dateTime(item.withdrawnAt)}</span>
                                      <small>Người rút: {item.withdrawerUserId ?? "Chưa có"}</small>
                                    </>
                                  ) : item.decidedAt ? (
                                    <>
                                      <time dateTime={item.decidedAt}>
                                        {dateTime(item.decidedAt)}
                                      </time>
                                      <small>Người duyệt: {item.reviewerUserId ?? "Chưa có"}</small>
                                    </>
                                  ) : (
                                    <span className="staff-revision-pending">
                                      Chưa có quyết định
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {item.rejectionReason && (
                                <tr className="staff-revision-reason-row">
                                  <td colSpan={4}>
                                    <strong>Lý do từ chối</strong>
                                    <p>{item.rejectionReason}</p>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

                <JobLegalReview review={review} findings={legalFindings} />
              </div>
              <aside className="compliance-inspector">
                <StaffJobPublicationControls
                  review={review}
                  scope={scope}
                  disabled={busy || mustReload}
                  onBusyChange={setPublicationBusy}
                />
                <section
                  className="admin-panel compliance-handling"
                  aria-labelledby="review-actions-title"
                >
                  <h2 id="review-actions-title">Xét duyệt phiên bản</h2>
                  <StaffStatusBadge tone={tone(review.state)}>
                    {revisionLabels[review.state]}
                  </StaffStatusBadge>
                  {review.state === "PENDING_REVIEW" && (
                    <StaffDetailNotice
                      title={review.approvalEligible ? "Có thể phê duyệt" : "Chưa thể phê duyệt"}
                      tone={review.approvalEligible ? "neutral" : "warning"}
                    >
                      <p>
                        {review.approvalEligible
                          ? "Đủ điều kiện phê duyệt. Đọc nội dung và đối chiếu hồ sơ trước khi quyết định."
                          : "Cần kiểm tra điều kiện trước khi phê duyệt."}
                      </p>
                    </StaffDetailNotice>
                  )}
                  <p>Đã gửi: {dateTime(review.submittedAt)}</p>
                  {legalFindings.length > 0 && (
                    <a className="staff-detail-legal-link" href="#job-legal-review-title">
                      <Eye size={14} aria-hidden="true" /> {legalFindings.length} nhóm nội dung cần
                      đối chiếu
                    </a>
                  )}
                  {review.state === "PENDING_REVIEW" ? (
                    <div className="staff-job-review-actions">
                      <button
                        className="admin-primary-action"
                        disabled={locked || !review.approvalEligible}
                        onClick={() => {
                          setError(null);
                          setOutcome("APPROVED");
                        }}
                      >
                        <Check size={16} aria-hidden="true" /> Phê duyệt phiên bản
                      </button>
                      <button
                        className="admin-secondary-action job-reject-action"
                        disabled={locked}
                        onClick={() => {
                          setError(null);
                          setOutcome("REJECTED");
                        }}
                      >
                        Từ chối phiên bản
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
                  {review.rejectionReason && (
                    <StaffDetailNotice title="Lý do từ chối" tone="danger">
                      <p>{review.rejectionReason}</p>
                    </StaffDetailNotice>
                  )}
                </section>
                <section
                  className="admin-panel staff-jobs-eligibility"
                  aria-labelledby="review-eligibility-title"
                >
                  <h2 id="review-eligibility-title">Điều kiện xét duyệt</h2>
                  <ul className="staff-review-conditions">
                    <li>
                      <span>Công ty</span>
                      <StaffStatusBadge tone={review.companyVerified ? "verified" : "pending"}>
                        {review.companyVerified ? "Đã xác minh" : "Chưa xác minh"}
                      </StaffStatusBadge>
                    </li>
                    <li>
                      <span>Đình chỉ công ty</span>
                      <StaffStatusBadge tone={review.companySuspended ? "rejected" : "verified"}>
                        {review.companySuspended ? "Đang bị đình chỉ" : "Không bị đình chỉ"}
                      </StaffStatusBadge>
                    </li>
                  </ul>
                  {!!review.validationIssues.length && (
                    <div className="staff-detail-warning">
                      <h3>Nội dung cần kiểm tra</h3>
                      <ul>
                        {review.validationIssues.map((issue, index) => (
                          <li key={index}>{staffJobIssueLabel(issue.field, issue.code)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </aside>
            </div>
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
            {outcome === "APPROVED" ? "Phê duyệt phiên bản" : "Từ chối phiên bản"}
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
                      ? "Xác nhận phê duyệt"
                      : "Xác nhận từ chối"}
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
