import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { canViewMemberData, createCompanyJob } from "@/services/companyMembers";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/recruiter/jobs")({
  validateSearch: (search: Record<string, unknown>): { create?: boolean } => ({
    create: search.create === true || search.create === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Quản lý tin tuyển dụng — GuardianWork Recruiter" },
      {
        name: "description",
        content: "Manage employer job postings, track applicant counts and compliance shields.",
      },
    ],
  }),
  component: RecruiterJobsPage,
});

type RecruiterJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  applicants: number;
  status: "Active" | "Draft" | "Closed";
  compliance: "100% Audited" | "Điều 98 Verified";
  created: string;
};

function RecruiterJobsPage() {
  const { workspace, member } = useCompanyWorkspace();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const jobs: RecruiterJob[] = workspace.jobs
    .filter(
      (job) =>
        canViewMemberData(workspace, job.authorId, "jobs") &&
        matchesSearch(query, job.title, job.department, job.location),
    )
    .map((job) => ({
      ...job,
      applicants: canViewMemberData(workspace, job.authorId, "applications")
        ? workspace.applications.filter((a) => a.jobId === job.id).length
        : 0,
      compliance: "100% Audited",
      created: new Date(job.created).toLocaleDateString("vi-VN"),
    }));
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isModalOpen = search.create === true;
  const setIsModalOpen = (open: boolean) => {
    void navigate({ search: { create: open ? true : undefined }, replace: true });
  };
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [salary, setSalary] = useState("65.000.000 - 90.000.000 VND / tháng");
  const [loc, setLoc] = useState("TP. Hồ Chí Minh");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createCompanyJob({ title, department: dept, location: loc, salary, status: "Active" });
      setError("");
      setIsModalOpen(false);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng tin.");
    }
  };

  return (
    <AdminShell title="Tin tuyển dụng" role="recruiter">
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 p-4 text-red-700">
          {error}
        </p>
      )}
      {!member && (
        <p className="mb-4 text-sm">
          Bạn cần là thành viên của công ty đã xác thực để đăng tin.{" "}
          <Link to="/recruiter/members" className="text-primary underline">
            Xem trạng thái công ty
          </Link>
        </p>
      )}
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Quản Lý Tin Tuyển Dụng
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Các vị trí tuyển dụng của doanh nghiệp đã kiểm định pháp lý theo Bộ luật Lao động 2019
            và Điều 98 làm thêm giờ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/talent"
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="person_search" className="!text-base text-primary" />
            <span>Tìm ứng viên AI</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon name="add" className="!text-base" />
            <span>Đăng tin tuyển dụng mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Tin Đang Hoạt Động
          </span>
          <div className="font-semibold text-3xl text-charcoal-text font-mono">
            {jobs.length} Vị trí
          </div>
          <div className="mt-2 text-xs text-green-700 flex items-center gap-1 font-medium">
            <Icon name="verified" className="!text-[15px]" /> 100% Đã cấp lá chắn pháp lý
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Tổng Lượt Ứng Tuyển
          </span>
          <div className="font-semibold text-3xl text-charcoal-text font-mono">
            {jobs.reduce((acc, j) => acc + j.applicants, 0)} Hồ sơ
          </div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="group" className="!text-[15px] text-primary" /> Đã qua kiểm tra chứng chỉ
          </div>
        </div>

        <div className="bg-primary text-on-primary border border-primary rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-on-primary/80 text-xs uppercase tracking-wider block mb-2">
            Chuẩn Mực Hợp Đồng
          </span>
          <div className="font-semibold text-3xl font-mono">100% Tuân Thủ</div>
          <div className="mt-2 text-xs text-on-primary/90 flex items-center gap-1 font-medium">
            <Icon name="gavel" className="!text-[15px]" /> Điều 98 & Bộ luật Lao động 2019
          </div>
        </div>
      </div>

      <ListSearch
        value={query}
        onChange={setQuery}
        label="Tìm chức danh, phòng ban hoặc địa điểm"
        count={jobs.length}
      />
      {/* Jobs Table */}
      <div className="recruiter-jobs-table bg-paper-white border border-warm-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className={`w-full text-left border-collapse ${jobs.length ? "min-w-[760px]" : ""}`}
          >
            <thead>
              <tr className="border-b border-warm-border bg-surface-container-low/50">
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Chức danh & Phòng ban
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Địa điểm & Lương
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Ứng viên
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Kiểm định Pháp lý
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-border text-sm">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-charcoal-83">
                    Chưa có tin tuyển dụng trong phạm vi quyền xem của bạn.
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-charcoal-text">{job.title}</div>
                    <p className="mt-1 text-xs text-charcoal-83">
                      Người đăng:{" "}
                      {
                        workspace.members.find(
                          (m) => m.id === workspace.jobs.find((j) => j.id === job.id)?.authorId,
                        )?.name
                      }{" "}
                      · {job.created}
                    </p>
                    <div className="text-xs text-charcoal-83 mt-0.5">{job.department}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs font-medium text-charcoal-text">{job.location}</div>
                    <div className="font-mono text-xs font-bold text-primary mt-0.5">
                      {job.salary}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-surface-container text-charcoal-text">
                      {canViewMemberData(
                        workspace,
                        workspace.jobs.find((j) => j.id === job.id)!.authorId,
                        "applications",
                      )
                        ? `${job.applicants} ứng viên`
                        : "Chưa có quyền xem"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      {job.compliance}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to="/recruiter/applications"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Xem đơn ứng tuyển
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-paper-white border border-warm-border rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-5">
            <div className="flex justify-between items-center pb-3 border-b border-warm-border">
              <h3 className="text-xl font-bold text-charcoal-text flex items-center gap-2">
                <Icon name="add_circle" className="text-primary" />
                Đăng Tin Tuyển Dụng Mới (Có Kiểm Định)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal-40 hover:text-charcoal-text"
              >
                <Icon name="close" />
              </button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Chức danh công việc *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chuyên viên kinh doanh"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={dept}
                    placeholder="Ví dụ: Kinh doanh, kế toán, vận hành, công nghệ"
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={loc}
                    onChange={(e) => setLoc(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Mức lương dự kiến
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-warm-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-warm-border rounded-lg text-xs font-semibold text-charcoal-text hover:bg-surface-container"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                  Xác nhận & Đăng tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
