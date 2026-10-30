import { useState } from "react";
import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RecruiterShell } from "@/components/RecruiterShell";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { canViewMemberData } from "@/services/companyMembers";

export const Route = createFileRoute("/recruiter/applications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Đơn ứng tuyển — GuardianWork" },
    ],
  }),
  component: ApplicationsPage,
});
function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const { workspace, member, company, error, refresh } = useCompanyWorkspace();
  const applications = workspace.applications.filter((a) => {
    const job = workspace.jobs.find((j) => j.id === a.jobId);
    return (
      job &&
      canViewMemberData(workspace, job.authorId, "applications") &&
      matchesSearch(query, a.name, a.email, job.title)
    );
  });
  return (
    <RecruiterShell title="Đơn ứng tuyển">
      <h1 className="mb-3 text-3xl font-bold">Đơn ứng tuyển</h1>
      <p className="mb-6 text-sm text-charcoal-83">
        Các đơn nộp vào tin của bạn và của thành viên đã cấp quyền cho bạn.
      </p>
      <ListSearch
        value={query}
        onChange={setQuery}
        label="Tìm ứng viên, thư điện tử hoặc vị trí ứng tuyển"
        count={applications.length}
      />
      {error ? (
        <div className="workspace-inline-note" role="alert">
          <p>{error}</p>
          <button className="admin-text-link" onClick={refresh}>
            Thử tải lại
          </button>
        </div>
      ) : !member || company?.verificationStatus !== "VERIFIED" ? (
        <div className="rounded-xl border border-warm-border bg-paper-white p-6">
          <p className="mb-3">Bạn cần là thành viên công ty đã xác thực để xem đơn ứng tuyển.</p>
          <Link to="/recruiter/members" className="text-primary">
            Xem thành viên công ty →
          </Link>
        </div>
      ) : (
        <div
          className="workspace-table-scroll"
          role="region"
          aria-label="Danh sách đơn ứng tuyển"
          tabIndex={0}
        >
          <table className="workspace-data-table min-w-[640px]">
            <caption className="sr-only">Danh sách đơn ứng tuyển trong phạm vi quyền xem</caption>
            <thead>
              <tr>
                <th scope="col">Ứng viên</th>
                <th scope="col">Vị trí ứng tuyển</th>
                <th scope="col">Thời điểm gửi</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const job = workspace.jobs.find((job) => job.id === application.jobId)!;
                return (
                  <tr key={application.id}>
                    <td>
                      <strong className="font-semibold">{application.name}</strong>
                      <p className="mt-1 text-sm text-charcoal-83">{application.email}</p>
                    </td>
                    <td>{job.title}</td>
                    <td>
                      <time dateTime={application.submittedAt}>
                        {new Date(application.submittedAt).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </time>
                    </td>
                  </tr>
                );
              })}
              {!applications.length && (
                <tr>
                  <td colSpan={3} className="py-10">
                    <p>
                      {query
                        ? "Không tìm thấy đơn phù hợp. Hãy thử từ khóa khác."
                        : "Chưa có đơn ứng tuyển trong phạm vi quyền xem của bạn."}
                    </p>
                    {!query && (
                      <Link to="/recruiter/jobs" className="admin-text-link mt-3">
                        Xem tin tuyển dụng
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </RecruiterShell>
  );
}
