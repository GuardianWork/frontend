import { useQuery } from "@tanstack/react-query";
import { latestJobRevision, type Job } from "@/services/jobs";
import { JobContentView } from "./JobContentView";
import { SuspendedJobNotice } from "./RecruiterJobGate";

export function SuspendedJobDetails({ job, scope }: { job: Job; scope: string }) {
  const latest = useQuery({
    queryKey: ["suspended-job-content", scope, job.id, job.version],
    queryFn: () => latestJobRevision(job.id),
    enabled: !job.workingRevision,
    retry: false,
    gcTime: 0,
  });
  const content = job.workingRevision?.content ?? latest.data?.content;
  return (
    <div className="jp-suspended-details">
      <header className="jp-page-header">
        <div>
          <h1>{content?.title || `Tin tuyển dụng #${job.id}`}</h1>
          <p>Thông tin phiên bản gần nhất · Chỉ xem · Tin #{job.id}</p>
        </div>
      </header>
      <SuspendedJobNotice headingLevel={2} />
      {content ? (
        <JobContentView content={content} showTitle={false} />
      ) : (
        <p role={latest.isError ? "alert" : "status"}>
          {latest.isError
            ? "Không thể tải thông tin tin tuyển dụng."
            : "Đang tải thông tin tin tuyển dụng…"}
        </p>
      )}
    </div>
  );
}
