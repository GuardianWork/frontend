import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ApplicationReview } from "@/components/recruiter/ApplicationReview";
import "@/components/recruiter/job-publishing.css";
import "@/components/recruiter/applications.css";

export const Route = createFileRoute("/rec/applications_/$jobId/$applicationId")({
  validateSearch: (search: Record<string, unknown>): { fromJobId?: number } => ({
    fromJobId:
      Number.isSafeInteger(Number(search.fromJobId)) && Number(search.fromJobId) > 0
        ? Number(search.fromJobId)
        : undefined,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Chi tiết đơn ứng tuyển — GuardianWork" },
    ],
  }),
  component: ApplicationPage,
});
function ApplicationPage() {
  const { jobId, applicationId } = Route.useParams();
  const { fromJobId } = Route.useSearch();
  const user = useAuthUser();
  const member = user?.activeMembership;
  const allowed = Boolean(member && ["OWNER", "RECRUITER"].includes(member.companyRole));
  const valid = /^\d+$/.test(jobId) && Number.isSafeInteger(Number(jobId)) && Number(jobId) > 0;
  const scope = `${user?.id}:${member?.companyId}:${member?.companyRole}:${member?.joinedAt}`;
  return (
    <div className="jp-page application-page application-detail-page">
      <Link className="jp-back" to="/rec/applications" search={{ jobId: fromJobId }}>
        Quay lại danh sách đơn ứng tuyển
      </Link>
      {!allowed || !valid ? (
        <div className="jp-empty" role="alert">
          <h1>
            {!allowed
              ? "Bạn không có quyền xem đơn ứng tuyển này."
              : "Đơn ứng tuyển không khả dụng"}
          </h1>
        </div>
      ) : (
        <ApplicationReview
          key={`${scope}:${jobId}:${applicationId}`}
          jobId={Number(jobId)}
          id={applicationId}
          scope={scope}
        />
      )}
    </div>
  );
}
