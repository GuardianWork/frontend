import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/recruiter/")({
  head: () => ({
    meta: [
      { title: "Recruiter Hub & Sourcing — GuardianWork" },
      {
        name: "description",
        content:
          "AI Sourcing agent, talent pipeline, and legally-audited job management for employers.",
      },
    ],
  }),
  component: RecruiterIndexPage,
});

type CandidateItem = {
  id: string;
  role: string;
  location: string;
  experience: string;
  fit: "STRONG FIT" | "GOOD FIT" | "MATCH";
  matchRate: number;
  stage: "Applied" | "Audited" | "Interview" | "Offer";
  description: string;
  skills: string[];
};

const CANDIDATES: CandidateItem[] = [
  {
    id: "sc-1",
    role: "Kỹ sư Hệ thống Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "6 năm K8s & Go",
    fit: "STRONG FIT",
    matchRate: 98,
    stage: "Interview",
    description:
      "6 năm quản lý hạ tầng Kubernetes. Chuyên sâu về cổng lưu lượng lớn, vi dịch vụ viết bằng Go và giám sát hệ thống bằng Prometheus.",
    skills: ["Kubernetes", "Go", "Docker", "Prometheus", "Distributed Systems"],
  },
  {
    id: "sc-2",
    role: "Kỹ sư Backend Cấp cao (Go)",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "5 năm Go & Redis",
    fit: "STRONG FIT",
    matchRate: 96,
    stage: "Audited",
    description:
      "5 năm kinh nghiệm xây dựng các cổng API an toàn bằng Go. Chuyên môn sâu về bộ nhớ đệm Redis, tối ưu hóa truy vấn PostgreSQL và tích hợp Kafka.",
    skills: ["Go", "Redis", "PostgreSQL", "Kafka", "High Throughput"],
  },
  {
    id: "sc-3",
    role: "Kỹ sư DevOps Nền tảng",
    location: "Hà Nội, Việt Nam",
    experience: "4 năm Terraform",
    fit: "GOOD FIT",
    matchRate: 89,
    stage: "Applied",
    description:
      "Kỹ sư lập trình Go vững vàng với 4 năm tự động hóa hạ tầng bằng Ansible, Terraform và Docker Swarm.",
    skills: ["Ansible", "Terraform", "Docker Swarm", "CI/CD", "Linux"],
  },
  {
    id: "sc-4",
    role: "Kỹ sư Di động Cấp cao",
    location: "Hà Nội, Việt Nam",
    experience: "5 năm React Native",
    fit: "STRONG FIT",
    matchRate: 95,
    stage: "Interview",
    description:
      "5 năm xây dựng ứng dụng di động native và React Native. Chuyên gia tối ưu hóa hiệu năng UI và tích hợp ZaloPay.",
    skills: ["React Native", "TypeScript", "iOS Native", "Android", "Payment SDK"],
  },
  {
    id: "sc-5",
    role: "Kỹ sư React Native",
    location: "Hà Nội, Việt Nam",
    experience: "3 năm TypeScript",
    fit: "GOOD FIT",
    matchRate: 85,
    stage: "Applied",
    description:
      "3 năm kinh nghiệm phát triển ứng dụng di động đa nền tảng. Thành thạo TypeScript, Redux Toolkit và lưu trữ token bảo mật.",
    skills: ["React Native", "Redux Toolkit", "Security", "REST API"],
  },
  {
    id: "sc-6",
    role: "Kỹ sư Frontend Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    experience: "7 năm React Architecture",
    fit: "STRONG FIT",
    matchRate: 97,
    stage: "Offer",
    description:
      "7 năm thiết kế kiến trúc React hiệu năng cao và hệ thống thiết kế web (Design Systems).",
    skills: ["React", "Next.js", "Design Systems", "Web Performance", "TypeScript"],
  },
];

function fitBadgeClass(fit: CandidateItem["fit"]) {
  if (fit === "STRONG FIT") return "bg-green-50 text-green-700 border border-green-200";
  if (fit === "GOOD FIT")
    return "bg-surface-container text-charcoal-text border border-warm-border";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

function RecruiterIndexPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>(CANDIDATES);
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id);
  const [filter, setFilter] = useState<"all" | "strong" | "interview">("all");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [pitchSent, setPitchSent] = useState(false);

  // New Job modal form state
  const [jobTitle, setJobTitle] = useState("");
  const [jobSalary, setJobSalary] = useState("60.000.000 - 85.000.000 VND / tháng");
  const [jobDept, setJobDept] = useState("Kỹ thuật");
  const [jobDesc, setJobDesc] = useState("");
  const [jobPostedSuccess, setJobPostedSuccess] = useState(false);

  const filteredCandidates = candidates.filter((c) => {
    if (filter === "strong") return c.fit === "STRONG FIT";
    if (filter === "interview") return c.stage === "Interview" || c.stage === "Offer";
    return true;
  });

  const activeCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

  const handleUpdateStage = (newStage: CandidateItem["stage"]) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === activeCandidate.id ? { ...c, stage: newStage } : c)),
    );
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    setJobPostedSuccess(true);
    setTimeout(() => {
      setJobPostedSuccess(false);
      setIsPostModalOpen(false);
      setJobTitle("");
      setJobDesc("");
    }, 1500);
  };

  return (
    <AdminShell title="Recruiter Hub & Sourcing" role="recruiter">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Recruiter Hub & Sourcing
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Triển khai đại lý AI tìm kiếm ứng viên công nghệ cao, quản lý kênh tuyển dụng và tạo tin
            tuyển dụng tuân thủ Điều 98.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/talent"
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="person_search" className="!text-base text-primary" />
            <span>Xem Talent Profiles</span>
          </Link>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon name="add" className="!text-base" />
            <span>Đăng tin Tuyển dụng</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Đơn Tuyển dụng Hoạt động
          </span>
          <div className="font-semibold text-3xl text-charcoal-text">12 Vị trí</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="check_circle" className="!text-[15px] text-green-600" /> 100% Đã kiểm toán
            pháp lý
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Ứng viên AI Đã Khớp
          </span>
          <div className="font-semibold text-3xl text-charcoal-text">142 Hồ sơ</div>
          <div className="mt-2 text-xs text-green-700 flex items-center gap-1 font-medium">
            <Icon name="trending_up" className="!text-[15px]" /> +24% tuần này
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Vòng Phỏng vấn
          </span>
          <div className="font-semibold text-3xl text-charcoal-text">18 Ứng viên</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="schedule" className="!text-[15px]" /> 4 lịch hẹn hôm nay
          </div>
        </div>

        <div className="bg-primary text-on-primary border border-primary rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-on-primary/80 text-xs uppercase tracking-wider block mb-2">
            Compliance Score
          </span>
          <div className="font-semibold text-3xl font-mono">100% Verified</div>
          <div className="mt-2 text-xs text-on-primary/90 flex items-center gap-1 font-medium">
            <Icon name="gavel" className="!text-[15px]" /> Điều 98 & Bộ luật 2019
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Candidates list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-paper-white p-3 rounded-xl border border-warm-border">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Tất cả ({candidates.length})
              </button>
              <button
                onClick={() => setFilter("strong")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "strong"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Strong Fit
              </button>
              <button
                onClick={() => setFilter("interview")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "interview"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text"
                }`}
              >
                Phỏng vấn & Offer
              </button>
            </div>
            <span className="text-xs font-mono text-charcoal-40">AI Sourced</span>
          </div>

          {filteredCandidates.map((c) => {
            const isActive = c.id === selectedId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setPitchSent(false);
                }}
                className={
                  isActive
                    ? "bg-paper-white p-5 rounded-xl border-l-4 border-l-primary border border-warm-border shadow-sm cursor-pointer transition-all"
                    : "bg-paper-white p-5 rounded-xl border border-warm-border hover:shadow-sm transition-shadow cursor-pointer opacity-85 hover:opacity-100"
                }
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight text-charcoal-text">
                      {c.role}
                    </h3>
                    <p className="text-xs text-charcoal-83 mt-0.5 font-medium">{c.location}</p>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${fitBadgeClass(c.fit)}`}
                  >
                    {c.fit}
                  </span>
                </div>

                <p className="text-xs text-charcoal-83 line-clamp-2 mt-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-3 pt-3 border-t border-warm-border flex items-center justify-between text-xs">
                  <span className="font-mono text-xs font-semibold text-primary">
                    Kinh nghiệm: {c.experience}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-charcoal-40 bg-surface-container px-2 py-0.5 rounded">
                    Stage: {c.stage}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Candidate Inspector & Pipeline Tracker */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-warm-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-50 text-green-700 border border-green-200">
                    MATCH RATE: {activeCandidate.matchRate}%
                  </span>
                  <span className="text-xs font-mono text-charcoal-40">
                    ID: #{activeCandidate.id.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-charcoal-text mt-1">
                  {activeCandidate.role}
                </h3>
                <p className="text-sm text-charcoal-83 font-medium">{activeCandidate.location}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPitchSent(true)}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Icon name="send" className="!text-base" />
                  <span>{pitchSent ? "Đã gửi Pitch ✓" : "Gửi Outreach Pitch"}</span>
                </button>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {/* Pipeline Stage Control */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-2">
                  Tiến độ Tuyển dụng (Pipeline Stage)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(["Applied", "Audited", "Interview", "Offer"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStage(st)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeCandidate.stage === st
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-paper-white border border-warm-border text-charcoal-83 hover:bg-surface-container"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Verification Note */}
              <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-5 rounded-lg flex gap-4">
                <Icon name="verified_user" className="text-primary mt-0.5 !text-2xl shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-text mb-1">
                    AI Sourcing & Legal Shield Guarantee
                  </h4>
                  <p className="text-sm text-charcoal-83 leading-relaxed mb-2">
                    Ứng viên được bảo vệ quyền ẩn danh trước nhà tuyển dụng cho đến khi được gửi
                    pitch chính thức. Thỏa ước tuyển dụng tuân thủ điều khoản thử việc và chế độ làm
                    thêm giờ theo Bộ luật Lao động 2019.
                  </p>
                  <div className="text-xs font-mono font-semibold text-green-700 flex items-center gap-1">
                    <Icon name="check" className="!text-sm" /> CV đã trích xuất tự động và đối chiếu
                    kỹ năng thực tế
                  </div>
                </div>
              </div>

              {/* Candidate Experience */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Icon name="account_box" className="!text-[18px]" />
                  Tổng quan Năng lực Ứng viên
                </h4>
                <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border text-sm text-charcoal-text leading-relaxed">
                  {activeCandidate.description}
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wide mb-2">
                  Kỹ năng Xác thực
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeCandidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-surface-container border border-warm-border rounded-md text-xs font-mono font-semibold text-charcoal-text"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Automated Outreach Pitch Draft */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Icon name="mark_email_read" className="!text-[18px] text-primary" />
                  Mẫu Tin nhắn Tiếp cận Đã tạo Tự động (Pitch Template)
                </h4>
                <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border font-mono text-xs text-charcoal-text leading-relaxed">
                  Chào bạn, chúng tôi theo dõi hồ sơ {activeCandidate.role} của bạn với chuyên môn
                  nổi bật về {activeCandidate.skills.slice(0, 3).join(", ")}. Công ty chúng tôi có
                  vị trí tương ứng với mức lương minh bạch, cam kết hợp đồng lao động chuẩn Bộ luật
                  2019 (bảo đảm lương OT Điều 98 & đóng đủ 100% BHXH). Bạn có sẵn sàng trao đổi ngắn
                  15 phút tuần này không?
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Job Modal with AI Compliance Guard */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-paper-white border border-warm-border rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-5">
            <div className="flex justify-between items-center pb-3 border-b border-warm-border">
              <h3 className="text-xl font-bold text-charcoal-text flex items-center gap-2">
                <Icon name="add_circle" className="text-primary" />
                Đăng Tin Tuyển dụng Có Kiểm toán Pháp lý
              </h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 rounded-md text-charcoal-40 hover:text-charcoal-text"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* AI Compliance Guard Note */}
            <div className="p-4 rounded-lg bg-parchment-bg border border-warm-border border-l-4 border-l-primary text-xs space-y-1">
              <div className="font-bold text-charcoal-text flex items-center gap-1.5">
                <Icon name="shield" className="!text-sm text-green-700" />
                <span>AI Compliance Guard: 100% Tuân thủ Bộ luật 2019</span>
              </div>
              <p className="text-charcoal-83">
                JD sẽ được tự động gắn nhãn "Verified Legal Shield", đảm bảo thử việc không quá 60
                ngày và thanh toán tiền làm thêm giờ theo Điều 98.
              </p>
            </div>

            {jobPostedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <Icon name="check_circle" className="!text-5xl text-green-600" />
                <h4 className="font-bold text-lg text-charcoal-text">Đăng tin thành công!</h4>
                <p className="text-xs text-charcoal-83">
                  Tin tuyển dụng đã được lưu vào hệ thống và gắn huy hiệu hợp chuẩn.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Chức danh công việc *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ sư Go / Kubernetes Cấp cao"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                      Phòng ban
                    </label>
                    <input
                      type="text"
                      value={jobDept}
                      onChange={(e) => setJobDept(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                      Mức lương dự kiến
                    </label>
                    <input
                      type="text"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Mô tả công việc
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Yêu cầu kỹ thuật, trách nhiệm chính..."
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-warm-border">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
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
