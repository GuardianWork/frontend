import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListSearch } from "@/components/ListSearch";
import { useAuthUser } from "@/hooks/useAuthUser";
import { latestJobRevision } from "@/services/jobs";
import { ApiError } from "@/services/api";
import { listRecruiterApplications } from "@/services/recruiterApplications";
import "@/components/recruiter/job-publishing.css";
import "@/components/recruiter/applications.css";

export const Route = createFileRoute("/rec/applications")({
  validateSearch: (search: Record<string, unknown>): { jobId?: number } => ({
    jobId:
      Number.isSafeInteger(Number(search.jobId)) && Number(search.jobId) > 0
        ? Number(search.jobId)
        : undefined,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Đơn ứng tuyển — GuardianWork" },
    ],
  }),
  component: ApplicationsPage,
});
function ApplicationsPage() {
  const { jobId } = Route.useSearch();
  const user = useAuthUser();
  const member = user?.activeMembership;
  const scope = `${user?.id}:${member?.companyId}:${member?.companyRole}:${member?.joinedAt}`;
  return (
    <Applications
      key={`${scope}:${jobId}`}
      jobId={jobId}
      scope={scope}
      allowed={Boolean(member && ["OWNER", "RECRUITER"].includes(member.companyRole))}
    />
  );
}
function Applications({
  jobId,
  scope,
  allowed,
}: {
  jobId?: number;
  scope: string;
  allowed: boolean;
}) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const pageFocus = useRef(false);
  const client = useQueryClient();
  const invalid = Array.from(input.trim()).length > 150;
  const waiting = input.trim() !== search;
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (invalid) return;
    const timer = setTimeout(() => {
      setSearch(input.trim());
      setPage(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [input, invalid]);
  const key = ["recruiter-applications", scope, jobId, search, page];
  const result = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listRecruiterApplications(jobId!, search, page, signal),
    enabled: allowed && Boolean(jobId) && !invalid && !waiting,
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const title = useQuery({
    queryKey: ["application-job-title", scope, jobId],
    queryFn: () => latestJobRevision(jobId!),
    enabled: Boolean(jobId && allowed && result.isSuccess),
    retry: false,
    gcTime: 0,
  });
  const status = result.error instanceof ApiError ? result.error.status : 0;
  useEffect(() => {
    if ([401, 403, 404].includes(status) || !allowed)
      client.removeQueries({ queryKey: ["recruiter-applications"], type: "inactive" });
  }, [status, allowed, client]);
  const data =
    !result.isError && !result.isFetching && !waiting && !invalid && allowed
      ? result.data
      : undefined;
  useEffect(() => {
    if (data && pageFocus.current) {
      heading.current?.focus();
      pageFocus.current = false;
    }
    if (data && page > 0 && data.totalPages <= page) setPage(Math.max(0, data.totalPages - 1));
  }, [data, page]);
  const back = (
    <Link className="jp-button" to="/rec/jobs">
      Về danh sách tin tuyển dụng
    </Link>
  );
  return (
    <div className="jp-page application-page">
      {jobId && (
        <Link className="jp-back" to="/rec/jobs" search={{ jobId }}>
          Quay lại tin tuyển dụng
        </Link>
      )}
      <header className="jp-page-header">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            Đơn ứng tuyển
          </h1>
          {jobId && (
            <p>
              {!result.isError && title.data?.content.title
                ? title.data.content.title
                : `Tin tuyển dụng #${jobId}`}
            </p>
          )}
        </div>
      </header>
      {!allowed ? (
        <div className="jp-empty" role="alert">
          <h2>Bạn không có quyền xem danh sách đơn ứng tuyển này.</h2>
          {back}
        </div>
      ) : !jobId ? (
        <div className="jp-empty">
          <h2>Chọn tin tuyển dụng để xem đơn ứng tuyển</h2>
          <Link className="jp-button jp-primary" to="/rec/jobs">
            Chọn tin tuyển dụng
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!invalid) {
                setSearch(input.trim());
                setPage(0);
              }
            }}
          >
            <ListSearch
              value={input}
              onChange={setInput}
              label="Tìm theo tên ứng viên"
              searchAction
              placeholder="Nhập tên ứng viên"
              count={data?.totalElements}
              describedBy={
                invalid
                  ? "application-search-help application-search-error"
                  : "application-search-help"
              }
              invalid={invalid}
            />
            <p id="application-search-help" className="sr-only">
              Có thể tìm không dấu, ví dụ: Nguyen. Tối đa 150 ký tự.
            </p>
            {invalid && (
              <p id="application-search-error" className="application-search-error" role="alert">
                Từ khóa quá dài. Vui lòng nhập tối đa 150 ký tự.
              </p>
            )}
          </form>

          <section
            className="application-results"
            aria-label="Kết quả đơn ứng tuyển"
            aria-busy={!invalid && !result.isError && !data}
          >
            {result.isError && !waiting && !invalid ? (
              <div className="jp-empty" role="alert">
                <h2>
                  {status === 404
                    ? "Tin tuyển dụng không khả dụng"
                    : status === 403
                      ? "Bạn không có quyền xem danh sách đơn ứng tuyển này."
                      : status === 401
                        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                        : status === 400
                          ? "Thông tin tìm kiếm không hợp lệ. Vui lòng kiểm tra và thử lại."
                          : "Không thể tải đơn ứng tuyển. Vui lòng thử lại."}
                </h2>
                {[403, 404].includes(status) ? (
                  back
                ) : status === 401 ? (
                  <Link className="jp-button jp-primary" to="/login">
                    Đăng nhập
                  </Link>
                ) : (
                  <button className="jp-button jp-primary" onClick={() => void result.refetch()}>
                    Thử lại
                  </button>
                )}
              </div>
            ) : invalid ? null : !data ? (
              <div className="application-loading" role="status">
                <p>Đang tải đơn ứng tuyển…</p>
                <div className="application-placeholders" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((row) => (
                    <div className="application-placeholder-row" key={row}>
                      <span />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              </div>
            ) : !data.content.length ? (
              <div className="jp-empty">
                <h2>{search ? "Không tìm thấy ứng viên phù hợp" : "Chưa có đơn ứng tuyển"}</h2>
                {search ? (
                  <button className="jp-button" onClick={() => setInput("")}>
                    Xóa tìm kiếm
                  </button>
                ) : (
                  <p>Các đơn ứng tuyển vào tin này sẽ xuất hiện tại đây.</p>
                )}
              </div>
            ) : (
              <>
                <table className="workspace-data-table application-table">
                  <caption className="sr-only">Đơn ứng tuyển vào tin tuyển dụng đã chọn</caption>
                  <thead>
                    <tr>
                      <th scope="col">Tên ứng viên</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Thời điểm ứng tuyển</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Tên ứng viên">
                          <strong>{a.candidateName}</strong>
                        </td>
                        <td data-label="Trạng thái">
                          <span className="jp-badge jp-info">Đã nộp</span>
                        </td>
                        <td data-label="Thời điểm ứng tuyển">
                          <time dateTime={a.appliedAt}>
                            {new Intl.DateTimeFormat("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Ho_Chi_Minh",
                            }).format(new Date(a.appliedAt))}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <AdminPagination
                  totalItems={data.totalElements}
                  page={data.pageNumber}
                  pageSize={data.pageSize}
                  itemLabel="đơn ứng tuyển"
                  label="Phân trang đơn ứng tuyển"
                  onPageChange={(next) => {
                    pageFocus.current = true;
                    setPage(next);
                  }}
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
