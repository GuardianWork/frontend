import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/recruiter/jobs")({
  head: () => ({
    meta: [
      { title: "Manage Jobs — GuardianWork Recruiter" },
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

const INITIAL_JOBS: RecruiterJob[] = [
  {
    id: "rec-job-1",
    title: "Kỹ sư Nền tảng Go / Kubernetes Cấp cao",
    department: "Kỹ thuật Hạ tầng",
    location: "TP. Hồ Chí Minh (Quận 3)",
    salary: "60M - 85M VND / tháng",
    applicants: 14,
    status: "Active",
    compliance: "100% Audited",
    created: "2 ngày trước",
  },
  {
    id: "rec-job-2",
    title: "Lập trình viên Di động React Native",
    department: "Kỹ thuật Di động",
    location: "Hà Nội (Cầu Giấy)",
    salary: "45M - 60M VND / tháng",
    applicants: 9,
    status: "Active",
    compliance: "Điều 98 Verified",
    created: "4 ngày trước",
  },
  {
    id: "rec-job-3",
    title: "Kiến trúc sư Giải pháp AI / Python",
    department: "Trí tuệ Nhân tạo",
    location: "Đà Nẵng (Từ xa / Hybrid)",
    salary: "70M - 100M VND / tháng",
    applicants: 18,
    status: "Active",
    compliance: "100% Audited",
    created: "1 tuần trước",
  },
  {
    id: "rec-job-4",
    title: "Kỹ sư Frontend Trưởng Cấp cao",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh (Quận 1)",
    salary: "80M - 110M VND / tháng",
    applicants: 12,
    status: "Active",
    compliance: "100% Audited",
    created: "2 tuần trước",
  },
];

function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<RecruiterJob[]>(INITIAL_JOBS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("Kỹ thuật");
  const [salary, setSalary] = useState("65.000.000 - 90.000.000 VND / tháng");
  const [loc, setLoc] = useState("TP. Hồ Chí Minh");
  const [success, setSuccess] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      const newJob: RecruiterJob = {
        id: `rec-job-${Date.now()}`,
        title,
        department: dept,
        location: loc,
        salary,
        applicants: 0,
        status: "Active",
        compliance: "100% Audited",
        created: "Vừa xong",
      };
      setJobs((prev) => [newJob, ...prev]);
      setSuccess(false);
      setIsModalOpen(false);
      setTitle("");
    }, 1200);
  };

  return (
    <AdminShell title="Manage Jobs" role="recruiter">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Quản Lý Tin Tuyển Dụng
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Các vị trí kỹ thuật của doanh nghiệp đã kiểm định pháp lý theo Bộ luật Lao động 2019 và
            Điều 98 làm thêm giờ.
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

      {/* Jobs Table */}
      <div className="bg-paper-white border border-warm-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-charcoal-text">{job.title}</div>
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
                      {job.applicants} ứng viên
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      {job.compliance}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to="/recruiter"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Xem Pipeline
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

            {success ? (
              <div className="py-8 text-center space-y-2">
                <Icon name="check_circle" className="!text-5xl text-green-600" />
                <h4 className="font-bold text-lg text-charcoal-text">
                  Tin tuyển dụng đã được lưu!
                </h4>
                <p className="text-xs text-charcoal-83">
                  Hệ thống đã tự động phê duyệt và gắn nhãn Điều 98.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Chức danh công việc *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ sư Giải pháp AI / LLM"
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
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
