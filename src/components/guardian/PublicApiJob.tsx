import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/services/api";
import { getPublicJobDetail } from "@/services/publicJobs";
import { JobContentView } from "@/components/recruiter/JobContentView";

/** Never render retained query data after a public retrieval failure. */
export function PublicApiJob({ id }: { id: string }) {
  const detail = useQuery({
    queryKey: ["public-job", id],
    queryFn: ({ signal }) => getPublicJobDetail(id, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  return (
    <section className="career-container career-detail">
      {detail.isFetching ? (
        <p role="status">Đang tải tin tuyển dụng…</p>
      ) : detail.isError ? (
        detail.error instanceof ApiError && detail.error.status === 404 ? (
          <h1>Tin tuyển dụng không còn khả dụng</h1>
        ) : (
          <div>
            <p role="alert">Không thể tải tin tuyển dụng. Vui lòng thử lại.</p>
            <button className="career-button" onClick={() => void detail.refetch()}>
              Thử tải lại
            </button>
          </div>
        )
      ) : detail.data?.content ? (
        <JobContentView content={detail.data.content} />
      ) : (
        <p role="alert">Dữ liệu tin tuyển dụng chưa hợp lệ. Vui lòng tải lại.</p>
      )}
    </section>
  );
}
