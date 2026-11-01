import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Plus, RotateCw, Users } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Route } from "@/routes/rec/jobs";
import {
  getJob,
  jobError,
  jobStatusLabels,
  latestJobRevision,
  listJobs,
  revisionLabels,
  type Job,
} from "@/services/jobs";
import { formatJobDate } from "@/lib/job-content";
import { JobWorkspace } from "./JobWorkspace";
import "./job-publishing.css";

export function RecruiterJobsPage() {
  const user = useAuthUser();
  const membership = user?.activeMembership;
  const scope = `${user?.id}:${membership?.companyId}:${membership?.companyRole}:${membership?.joinedAt}`;
  const owner = membership?.companyRole === "OWNER";
  const allowed = membership && ["OWNER", "RECRUITER"].includes(membership.companyRole);
  const { create, jobId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [status, setStatus] = useState("");
  const [needsReassignment, setNeedsReassignment] = useState(false);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const list = useQuery({
    queryKey: ["publishing-jobs", scope, page, status, needsReassignment],
    queryFn: () => listJobs(page, status, needsReassignment),
    enabled: Boolean(allowed && !create && !jobId),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const detail = useQuery({
    queryKey: ["publishing-job", scope, jobId, reload],
    queryFn: () => getJob(jobId!),
    enabled: Boolean(allowed && jobId && !create),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
  });
  const back = () => {
    void navigate({ search: {} });
  };
  return (
    <AdminShell title="Tin tuyển dụng" role="recruiter">
      <div className="jp-page">
        {!allowed ? (
          <div className="jp-empty">
            <BriefcaseBusiness size={32} aria-hidden="true" />
            <h1>Tham gia công ty để quản lý tin</h1>
            <p>Bạn cần là chủ sở hữu hoặc nhà tuyển dụng đang hoạt động trong công ty.</p>
            <Link className="jp-button jp-primary" to="/rec/verification">
              Xem thông tin công ty
            </Link>
          </div>
        ) : create ? (
          <JobWorkspace
            key={`new:${scope}`}
            initialJob={null}
            scope={scope}
            owner={owner}
            onBack={back}
            onCreated={(job) => {
              void navigate({ search: { jobId: job.id }, replace: true });
            }}
          />
        ) : jobId ? (
          detail.isPending ? (
            <p className="jp-loading" role="status">
              Đang tải tin tuyển dụng…
            </p>
          ) : detail.isError ? (
            <div className="jp-empty">
              <h1>Chưa tải được tin</h1>
              <p role="alert">{jobError(detail.error)}</p>
              <div className="jp-actions">
                <button className="jp-button" onClick={back}>
                  Quay lại danh sách
                </button>
                <button
                  className="jp-button jp-primary"
                  onClick={() => {
                    void detail.refetch();
                  }}
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : (
            <JobWorkspace
              key={`${scope}:${jobId}:${reload}`}
              initialJob={detail.data}
              scope={scope}
              owner={owner}
              onBack={back}
              onReload={() => setReload((value) => value + 1)}
            />
          )
        ) : (
          <>
            <header className="jp-page-header">
              <div>
                <h1>Tin tuyển dụng</h1>
                <p>
                  {owner
                    ? "Quản lý nội dung đăng tuyển và phân công người phụ trách."
                    : "Soạn nội dung và theo dõi các tin được phân công cho bạn."}
                </p>
              </div>
              <Link className="jp-button jp-primary" to="/rec/jobs" search={{ create: true }}>
                <Plus size={18} aria-hidden="true" />
                Đăng tin tuyển dụng
              </Link>
            </header>
            <div className="jp-list-panel">
              <div className="jp-filters">
                <label>
                  Trạng thái xuất bản
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(jobStatusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {owner && (
                  <label className="jp-check">
                    <input
                      type="checkbox"
                      checked={needsReassignment}
                      onChange={(e) => {
                        setNeedsReassignment(e.target.checked);
                        setPage(0);
                      }}
                    />
                    Cần phân công lại
                  </label>
                )}
                <button
                  className="jp-button jp-quiet jp-refresh"
                  disabled={list.isFetching}
                  onClick={() => {
                    void list.refetch();
                  }}
                >
                  <RotateCw size={16} aria-hidden="true" />
                  Tải lại
                </button>
              </div>
              <p className="jp-list-note">
                Trạng thái xuất bản và trạng thái bản sửa được theo dõi riêng. Tin chỉ công khai sau
                khi được duyệt.
              </p>
              {list.isPending ? (
                <p className="jp-loading" role="status">
                  Đang tải danh sách…
                </p>
              ) : list.isError ? (
                <div className="jp-empty">
                  <h3>Chưa tải được danh sách</h3>
                  <p role="alert">{jobError(list.error)}</p>
                  <button
                    className="jp-button"
                    onClick={() => {
                      void list.refetch();
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              ) : !list.data.content.length ? (
                <div className="jp-empty">
                  <BriefcaseBusiness size={32} aria-hidden="true" />
                  <h3>
                    {status || needsReassignment || page
                      ? "Không có tin phù hợp"
                      : "Bắt đầu với tin tuyển dụng đầu tiên"}
                  </h3>
                  <p>
                    {status || needsReassignment || page
                      ? "Thay đổi bộ lọc hoặc quay về trang đầu để xem các tin khác."
                      : "Lưu bản nháp, xem trước nội dung và gửi duyệt khi đã sẵn sàng."}
                  </p>
                  {status || needsReassignment || page ? (
                    <button
                      className="jp-button"
                      onClick={() => {
                        setStatus("");
                        setNeedsReassignment(false);
                        setPage(0);
                      }}
                    >
                      Xem tất cả tin
                    </button>
                  ) : (
                    <Link className="jp-button jp-primary" to="/rec/jobs" search={{ create: true }}>
                      Đăng tin tuyển dụng
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="jp-job-list">
                  {list.data.content.map((job) => (
                    <JobRow key={job.id} job={job} scope={scope} />
                  ))}
                </ul>
              )}
              {list.data && !list.isError && (
                <AdminPagination
                  page={page}
                  totalItems={list.data.totalElements}
                  pageSize={20}
                  onPageChange={setPage}
                  itemLabel="tin tuyển dụng"
                />
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
function JobRow({ job, scope }: { job: Job; scope: string }) {
  const latest = useQuery({
    queryKey: ["job-latest-revision", scope, job.id, job.version],
    queryFn: () => latestJobRevision(job.id),
    enabled: !job.workingRevision,
    retry: false,
  });
  const revision = job.workingRevision ?? latest.data;
  const content = revision?.content;
  return (
    <li className="jp-job-row">
      <div className="jp-job-main">
        <div className="jp-badges">
          <span className={`jp-badge jp-status-${job.status.toLowerCase()}`}>
            {jobStatusLabels[job.status]}
          </span>
          {revision && (
            <span className={`jp-badge jp-revision-${revision.state.toLowerCase()}`}>
              {revisionLabels[revision.state]} · v{revision.revisionNumber}
            </span>
          )}
          {job.needsReassignment && <span className="jp-badge jp-warning">Cần phân công lại</span>}
        </div>
        <Link className="jp-job-title" to="/rec/jobs" search={{ jobId: job.id }}>
          {content?.title || `Tin tuyển dụng #${job.id}`}
        </Link>
        <p>
          {content?.location || "Chưa có địa điểm"} <span aria-hidden="true">·</span> Cập nhật{" "}
          {formatJobDate(job.updatedAt)}
        </p>
        {latest.isError && (
          <p className="jp-hint">Chưa tải được tiêu đề bản gần nhất. Mở tin để tải lại.</p>
        )}
      </div>
      <div className="jp-job-responsibility">
        <Users size={17} aria-hidden="true" />
        <span>
          {job.ownerResponsible
            ? "Chủ sở hữu phụ trách"
            : `${job.assignments.length} nhà tuyển dụng phụ trách`}
        </span>
        <small>Hạn đã duyệt: {formatJobDate(job.approvedDeadline)}</small>
      </div>
      <Link
        className="jp-button"
        to="/rec/jobs"
        search={{ jobId: job.id }}
        aria-label={`Quản lý ${content?.title || `tin #${job.id}`}`}
      >
        Quản lý
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </li>
  );
}
