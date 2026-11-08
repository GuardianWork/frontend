import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Plus,
  RotateCw,
  Users,
  FileUser,
} from "lucide-react";
import { ListSearch } from "@/components/ListSearch";
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
import { SuspendedJobDetails } from "./SuspendedJobDetails";
import "./job-publishing.css";

export function RecruiterJobsPage() {
  const user = useAuthUser();
  const membership = user?.activeMembership;
  const scope = `${user?.id}:${membership?.companyId}:${membership?.companyRole}:${membership?.joinedAt}`;
  const owner = membership?.companyRole === "OWNER";
  const allowed = membership && ["OWNER", "RECRUITER"].includes(membership.companyRole);
  const search = Route.useSearch();
  const { create, jobId, keyword = "", status = "", page = 0 } = search;
  const needsReassignment = owner && Boolean(search.needsReassignment);
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(keyword);
  useEffect(() => setQuery(keyword), [keyword]);
  const filtered = Boolean(keyword || status || needsReassignment);
  const resetFilters = () => {
    setQuery("");
    void navigate({ search: {} });
  };
  const [reload, setReload] = useState(0);
  const list = useQuery({
    queryKey: ["publishing-jobs", scope, page, status, needsReassignment, keyword],
    queryFn: () => listJobs(page, status, needsReassignment, keyword),
    enabled: Boolean(allowed && !create && !jobId),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const detail = useQuery({
    queryKey: ["publishing-job", scope, jobId, reload],
    queryFn: () => getJob(jobId!),
    enabled: Boolean(allowed && jobId && !create),
    retry: false,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: 10000,
    gcTime: 0,
  });
  const back = () => {
    void navigate({ search: { ...search, create: undefined, jobId: undefined } });
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
              void navigate({
                search: { ...search, create: undefined, jobId: job.id },
                replace: true,
              });
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
          ) : detail.data?.status === "SUSPENDED" ? (
            <>
              <button className="jp-back" onClick={back}>
                Quay lại danh sách
              </button>
              <SuspendedJobDetails job={detail.data} scope={scope} />
            </>
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
              <Link
                className="jp-button jp-primary"
                to="/rec/jobs"
                search={{ ...search, create: true }}
              >
                <Plus size={18} aria-hidden="true" />
                Đăng tin tuyển dụng
              </Link>
            </header>
            <div className="jp-list-panel">
              <form
                className="jp-search"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  void navigate({
                    search: { ...search, keyword: query.trim() || undefined, page: undefined },
                  });
                }}
              >
                <ListSearch
                  value={query}
                  onChange={setQuery}
                  label="Tìm theo tiêu đề tin"
                  placeholder="Nhập tiêu đề tin tuyển dụng"
                  searchAction
                  submitLabel="Tìm kiếm"
                  maxLength={200}
                />
              </form>
              <div className="jp-filters">
                <label>
                  Trạng thái xuất bản
                  <select
                    value={status}
                    onChange={(e) => {
                      void navigate({
                        search: {
                          ...search,
                          status: (e.target.value || undefined) as typeof search.status,
                          page: undefined,
                        },
                      });
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
                        void navigate({
                          search: {
                            ...search,
                            needsReassignment: e.target.checked || undefined,
                            page: undefined,
                          },
                        });
                      }}
                    />
                    Cần phân công lại
                  </label>
                )}
                {filtered && (
                  <button className="jp-button jp-quiet" onClick={resetFilters}>
                    Xóa bộ lọc
                  </button>
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
              {!list.isError && list.data && (
                <p className="jp-search-results" role="status">
                  {list.isFetching
                    ? "Đang cập nhật kết quả…"
                    : `${list.data.totalElements.toLocaleString("vi-VN")} tin tuyển dụng${filtered ? " phù hợp" : ""}`}
                  {keyword && <> cho “{keyword}”</>}
                </p>
              )}
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
                    {filtered || page
                      ? "Không có tin phù hợp"
                      : owner
                        ? "Bắt đầu với tin tuyển dụng đầu tiên"
                        : "Chưa có tin được phân công"}
                  </h3>
                  <p>
                    {filtered || page
                      ? "Thử tiêu đề khác hoặc xóa bộ lọc để xem các tin còn lại."
                      : owner
                        ? "Lưu bản nháp, xem trước nội dung và gửi duyệt khi đã sẵn sàng."
                        : "Tin được chủ sở hữu phân công cho bạn sẽ xuất hiện tại đây. Bạn cũng có thể tạo tin mới."}
                  </p>
                  {filtered || page ? (
                    <button className="jp-button" onClick={resetFilters}>
                      Xem tất cả tin
                    </button>
                  ) : (
                    <Link
                      className="jp-button jp-primary"
                      to="/rec/jobs"
                      search={{ ...search, create: true }}
                    >
                      Đăng tin tuyển dụng
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="jp-job-columns" aria-hidden="true">
                    <span>Tin tuyển dụng</span>
                    <span>Ứng viên</span>
                    <span>Phụ trách · Hạn ứng tuyển</span>
                    <span>Thao tác</span>
                  </div>
                  <ul className="jp-job-list">
                    {list.data.content.map((job) => (
                      <JobRow key={job.id} job={job} scope={scope} />
                    ))}
                  </ul>
                </>
              )}
              {list.data && !list.isError && (
                <AdminPagination
                  page={page}
                  totalItems={list.data.totalElements}
                  pageSize={20}
                  onPageChange={(nextPage) => {
                    void navigate({ search: { ...search, page: nextPage || undefined } });
                  }}
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
  const search = Route.useSearch();
  const latest = useQuery({
    queryKey: ["job-latest-revision", scope, job.id, job.version],
    queryFn: () => latestJobRevision(job.id),
    enabled: job.status !== "SUSPENDED" && !job.workingRevision,
    retry: false,
  });
  const revision = job.workingRevision ?? latest.data;
  const content = revision?.content;
  return (
    <li className="jp-job-row">
      <div className="jp-job-main">
        <Link className="jp-job-title" to="/rec/jobs" search={{ ...search, jobId: job.id }}>
          {content?.title || `Tin tuyển dụng #${job.id}`}
        </Link>
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
        <p className="jp-job-meta">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {content?.location || "Chưa có địa điểm"}
          </span>
          <span>Cập nhật {formatJobDate(job.updatedAt)}</span>
        </p>
        {latest.isError && (
          <p className="jp-hint">Chưa tải được tiêu đề bản gần nhất. Mở tin để tải lại.</p>
        )}
      </div>
      <div className="jp-job-candidates">
        {job.status === "SUSPENDED" ? (
          <span
            className="jp-candidate-unavailable"
            aria-label="Không thể xem ứng viên khi tin bị ẩn"
          >
            —
          </span>
        ) : job.applicationCount == null ? (
          <Link className="jp-candidate-fallback" to="/rec/applications" search={{ jobId: job.id }}>
            <FileUser size={18} aria-hidden="true" />
            Xem ứng viên
          </Link>
        ) : (
          <Link
            className="jp-candidate-count"
            to="/rec/applications"
            search={{ jobId: job.id }}
            aria-label={`${job.applicationCount} ứng viên cho ${content?.title || `tin #${job.id}`}`}
          >
            <span>
              <FileUser size={20} aria-hidden="true" />
              <strong>{job.applicationCount.toLocaleString("vi-VN")}</strong>
            </span>
            <span>ứng viên</span>
          </Link>
        )}
      </div>
      <div className="jp-job-responsibility">
        <Users size={17} aria-hidden="true" />
        <span>
          {job.ownerResponsible
            ? "Chủ sở hữu phụ trách"
            : `${job.assignments.length} nhà tuyển dụng phụ trách`}
        </span>
        <CalendarDays size={17} aria-hidden="true" />
        <small>Hạn đã duyệt: {formatJobDate(job.approvedDeadline)}</small>
      </div>
      <div className="jp-job-actions">
        <Link
          className="jp-button jp-quiet"
          to="/rec/jobs"
          search={{ ...search, jobId: job.id }}
          aria-label={`Quản lý ${content?.title || `tin #${job.id}`}`}
        >
          Quản lý
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
