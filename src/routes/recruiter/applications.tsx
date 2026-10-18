import { createFileRoute, Link } from "@tanstack/react-router";
import { RecruiterShell } from "@/components/RecruiterShell";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { canViewMemberData } from "@/services/companyMembers";

export const Route = createFileRoute("/recruiter/applications")({
  head: () => ({ meta: [{ title: "Đơn ứng tuyển — GuardianWork" }] }),
  component: ApplicationsPage,
});
function ApplicationsPage() {
  const { workspace, member, company, error } = useCompanyWorkspace();
  const applications = workspace.applications.filter((a) => {
    const job = workspace.jobs.find((j) => j.id === a.jobId);
    return job && canViewMemberData(workspace, job.authorId, "applications");
  });
  return (
    <RecruiterShell title="Đơn ứng tuyển">
      <h1 className="mb-3 text-3xl font-bold">Đơn ứng tuyển</h1>
      <p className="mb-6 text-sm text-charcoal-83">
        Các đơn nộp vào tin của bạn và của thành viên đã cấp quyền cho bạn.
      </p>
      {error && <p role="alert">{error}</p>}
      {!member || company?.verificationStatus !== "VERIFIED" ? (
        <div className="rounded-xl border border-warm-border bg-paper-white p-6">
          <p className="mb-3">Bạn cần là thành viên công ty đã xác thực để xem đơn ứng tuyển.</p>
          <Link to="/recruiter/members" className="text-primary">
            Xem thành viên công ty →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.length ? (
            applications.map((a) => {
              const job = workspace.jobs.find((j) => j.id === a.jobId)!;
              return (
                <article
                  key={a.id}
                  className="rounded-xl border border-warm-border bg-paper-white p-5"
                >
                  <h2 className="font-semibold">{a.name}</h2>
                  <p className="mt-2 text-sm">{a.email}</p>
                  <p className="mt-1 text-sm">Ứng tuyển: {job.title}</p>
                  <p className="mt-1 text-xs text-charcoal-83">
                    {new Date(a.submittedAt).toLocaleString("vi-VN")}
                  </p>
                </article>
              );
            })
          ) : (
            <p className="rounded-xl border border-warm-border bg-paper-white p-8 text-sm text-charcoal-83">
              Chưa có đơn ứng tuyển trong phạm vi quyền xem của bạn.
            </p>
          )}
        </div>
      )}
    </RecruiterShell>
  );
}
