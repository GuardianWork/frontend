import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import {
  useRecruiter,
  type RecruiterJob,
  type RecruiterCandidate,
} from "@/context/RecruiterContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Sparkles,
  MapPin,
  X,
  FileCheck,
} from "lucide-react";

export function RecruiterView() {
  const { dict } = useLanguage();
  const {
    activeTab,
    setActiveTab,
    jobs,
    candidates,
    isPostModalOpen,
    setIsPostModalOpen,
    postJob,
    updateCandidateStage,
  } = useRecruiter();

  // New Job Modal state
  const [newTitle, setNewTitle] = useState("");
  const [newDept, setNewDept] = useState("Kỹ thuật");
  const [newLocation, setNewLocation] = useState("TP. Hồ Chí Minh (Quận 1)");
  const [newSalary, setNewSalary] = useState("50.000.000 - 75.000.000 VND / tháng");
  const [newDesc, setNewDesc] = useState("");

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    postJob({
      title: newTitle,
      department: newDept,
      location: newLocation,
      salaryRange: newSalary,
      description: newDesc,
      status: "active",
    });

    setNewTitle("");
    setNewDesc("");
    setIsPostModalOpen(false);
  };

  const getFitBadge = (fit: RecruiterCandidate["fitScore"]) => {
    if (fit === "STRONG FIT") {
      return (
        <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald/15 text-emerald border border-emerald/20">
          PHÙ HỢP TỐT (98%)
        </span>
      );
    }
    if (fit === "GOOD FIT") {
      return (
        <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
          TƯƠNG THÍCH TỐT (88%)
        </span>
      );
    }
    return (
      <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20">
        PHÙ HỢP (80%)
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors selection:bg-accent selection:text-accent-ink">
      <Header variant="workbench" />

      {/* Recruiter Navigation Bar */}
      <div className="border-b border-rule bg-paper-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-accent text-accent-ink font-bold shadow-2xs"
                  : "bg-paper border border-rule text-ink-2 hover:text-ink hover:bg-paper-3"
              }`}
            >
              Thống kê
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-accent text-accent-ink font-bold shadow-2xs"
                  : "bg-paper border border-rule text-ink-2 hover:text-ink hover:bg-paper-3"
              }`}
            >
              Đơn tuyển dụng ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "candidates"
                  ? "bg-accent text-accent-ink font-bold shadow-2xs"
                  : "bg-paper border border-rule text-ink-2 hover:text-ink hover:bg-paper-3"
              }`}
            >
              Ứng viên AI ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "pipeline"
                  ? "bg-accent text-accent-ink font-bold shadow-2xs"
                  : "bg-paper border border-rule text-ink-2 hover:text-ink hover:bg-paper-3"
              }`}
            >
              Test Pipeline
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-ink-3">
              <span>
                Đang tuyển:{" "}
                <strong className="text-emerald">
                  {jobs.filter((j) => j.status === "active").length}
                </strong>
              </span>
              <span>·</span>
              <span>
                Bản nháp:{" "}
                <strong className="text-ink">
                  {jobs.filter((j) => j.status === "draft").length}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="btn !h-8 !px-3.5 !text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng tin</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8">
            {/* Hello Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-paper-2 border border-rule shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest">
                  Bảng điều khiển Nhà tuyển dụng
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
                  Xin chào, Nguyen.
                </h1>
                <p className="font-body text-xs sm:text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
                  Triển khai các trợ lý để tìm kiếm ứng viên tiềm năng, viết tin nhắn cá nhân hóa và
                  mở rộng tìm kiếm khi cần. Có ứng viên đầu tiên trong chưa đầy hai phút.
                </p>
              </div>

              <button
                onClick={() => setIsPostModalOpen(true)}
                className="btn !px-6 !py-3 text-xs font-bold shadow-md shrink-0 cursor-pointer"
              >
                <span>+ Đăng tin tuyển dụng mới</span>
              </button>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-paper border border-rule shadow-2xs">
                <div className="flex items-center justify-between text-ink-3 mb-3">
                  <span className="font-mono text-xs uppercase font-bold">Đơn ứng tuyển</span>
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div className="font-display text-3xl font-extrabold text-ink">48</div>
                <div className="font-mono text-[11px] text-emerald mt-1 font-semibold">
                  +18% 8 tuần qua
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-paper border border-rule shadow-2xs">
                <div className="flex items-center justify-between text-ink-3 mb-3">
                  <span className="font-mono text-xs uppercase font-bold">Lượt xem tìm nguồn</span>
                  <TrendingUp className="w-4 h-4 text-emerald" />
                </div>
                <div className="font-display text-3xl font-extrabold text-ink">1,240</div>
                <div className="font-mono text-[11px] text-ink-3 mt-1">Tỷ lệ tương tác cao</div>
              </div>

              <div className="p-5 rounded-2xl bg-paper border border-rule shadow-2xs">
                <div className="flex items-center justify-between text-ink-3 mb-3">
                  <span className="font-mono text-xs uppercase font-bold">Đã chọn lọc</span>
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <div className="font-display text-3xl font-extrabold text-ink">14</div>
                <div className="font-mono text-[11px] text-accent mt-1 font-semibold">
                  Sẵn sàng phỏng vấn
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-paper border border-rule shadow-2xs">
                <div className="flex items-center justify-between text-ink-3 mb-3">
                  <span className="font-mono text-xs uppercase font-bold">Tạm hoãn</span>
                  <Clock className="w-4 h-4 text-ink-3" />
                </div>
                <div className="font-display text-3xl font-extrabold text-ink">3</div>
                <div className="font-mono text-[11px] text-ink-3 mt-1">Chờ ứng viên phản hồi</div>
              </div>
            </div>

            {/* Active Postings Overview Table */}
            <div className="p-6 rounded-2xl bg-paper border border-rule shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-ink">
                  Vị trí đang tuyển dụng hoạt động
                </h3>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className="font-mono text-xs text-accent hover:underline font-bold"
                >
                  Xem tất cả ({jobs.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-body">
                  <thead>
                    <tr className="border-b border-rule font-mono text-[11px] uppercase text-ink-3">
                      <th className="pb-3 font-bold">Vị trí</th>
                      <th className="pb-3 font-bold">Địa điểm & Lương</th>
                      <th className="pb-3 font-bold">Tuân thủ VN</th>
                      <th className="pb-3 font-bold">Ứng viên</th>
                      <th className="pb-3 font-bold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/50">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-paper-2 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-ink">{job.title}</div>
                          <div className="font-mono text-[10px] text-ink-3">{job.department}</div>
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs">
                          <div className="text-ink">{job.location}</div>
                          <div className="text-accent font-semibold">{job.salaryRange}</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald bg-emerald/10 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> 100%
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 font-mono text-xs font-bold text-ink">
                          {job.applicantsCount} ứng viên
                        </td>
                        <td className="py-3.5 text-right font-mono text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase ${
                              job.status === "active"
                                ? "bg-emerald/15 text-emerald"
                                : "bg-paper-2 text-ink-3"
                            }`}
                          >
                            {job.status === "active" ? "Đang tuyển" : "Bản nháp"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: JOBS */}
        {activeTab === "jobs" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Tất cả bài đăng tuyển dụng
                </h2>
                <p className="text-xs text-ink-3 font-mono mt-1">
                  Đã kiểm toán pháp lý trước theo Bộ luật Lao động 2019
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="btn !h-9 !px-4 text-xs font-bold cursor-pointer"
              >
                + Đăng tin mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-paper border border-rule hover:border-rule-2 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-accent">
                        {job.department}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          job.status === "active"
                            ? "bg-emerald/15 text-emerald"
                            : "bg-paper-2 text-ink-3"
                        }`}
                      >
                        {job.status === "active" ? "Đang tuyển" : "Bản nháp"}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink">{job.title}</h3>
                    <p className="font-mono text-xs text-ink-3 mt-1">{job.location}</p>
                    <p className="font-mono text-xs text-accent font-bold mt-1">
                      {job.salaryRange}
                    </p>
                    <p className="font-body text-xs text-ink-2 mt-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-rule flex items-center justify-between font-mono text-xs">
                    <span className="text-ink-3">{job.applicantsCount} ứng viên đã nộp đơn</span>
                    <button
                      onClick={() => setActiveTab("candidates")}
                      className="text-accent font-bold hover:underline"
                    >
                      Tìm kiếm nhân tài →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: AI CANDIDATES SOURCING */}
        {activeTab === "candidates" && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Đại lý AI Tìm nguồn Ứng viên
                </h2>
                <p className="text-xs text-ink-3 font-mono mt-1">
                  Kỹ sư IT Việt Nam đã kiểm toán CV và xác minh danh tính
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-5 rounded-2xl bg-paper border border-rule hover:border-rule-2 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="w-10 h-10 rounded-full bg-accent/15 text-accent font-mono text-xs font-bold flex items-center justify-center">
                        {cand.id.toUpperCase()}
                      </span>
                      {getFitBadge(cand.fitScore)}
                    </div>

                    <div>
                      <h4 className="font-display text-base font-bold text-ink">{cand.role}</h4>
                      <div className="font-mono text-xs text-ink-3 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-ink-3" />
                        <span>{cand.location}</span>
                      </div>
                    </div>

                    <p className="font-body text-xs text-ink-2 leading-relaxed">
                      {cand.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-rule flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-3">
                      Giai đoạn: {cand.stage}
                    </span>
                    <button
                      onClick={() => updateCandidateStage(cand.id, "Interview")}
                      className="btn !h-7 !px-3 !text-[11px] font-bold cursor-pointer"
                    >
                      Gửi Pitch →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: PIPELINE KANBAN */}
        {activeTab === "pipeline" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Kênh Tuyển dụng (Pipeline)
              </h2>
              <p className="text-xs text-ink-3 font-mono mt-1">
                Theo dõi quy trình phỏng vấn & bảo vệ hợp đồng theo Điều 98
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              {(["Applied", "Audited", "Interview", "Offer"] as const).map((stage) => {
                const stageCandidates = candidates.filter((c) => c.stage === stage);
                const labels: Record<string, string> = {
                  Applied: "Đã nộp đơn",
                  Audited: "Đã kiểm toán",
                  Interview: "Phỏng vấn",
                  Offer: "Đề nghị (Offer)",
                };

                return (
                  <div
                    key={stage}
                    className="p-4 rounded-2xl bg-paper-2 border border-rule flex flex-col gap-3 min-h-[360px]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rule">
                      <h3 className="font-mono text-xs uppercase font-bold text-ink">
                        {labels[stage]}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-paper font-bold text-ink">
                        {stageCandidates.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {stageCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-paper border border-rule hover:border-ink transition-all shadow-2xs"
                        >
                          <div className="font-bold text-xs text-ink">{c.role}</div>
                          <div className="font-mono text-[10px] text-ink-3 mt-0.5">
                            {c.location}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            {getFitBadge(c.fitScore)}
                            <div className="flex gap-1">
                              {stage !== "Offer" && (
                                <button
                                  onClick={() => {
                                    const nextStage =
                                      stage === "Applied"
                                        ? "Audited"
                                        : stage === "Audited"
                                          ? "Interview"
                                          : "Offer";
                                    updateCandidateStage(c.id, nextStage);
                                  }}
                                  className="text-[10px] font-mono font-bold text-accent hover:underline"
                                  title="Chuyển sang bước tiếp theo"
                                >
                                  Tiếp →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Post Job Modal with AI Compliance Guard */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-paper border border-rule rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-paper-2 border border-rule text-ink hover:bg-paper-3 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="font-mono text-xs uppercase font-bold text-accent tracking-widest">
                Đăng vị trí tuyển dụng mới
              </span>
              <h2 className="font-display text-2xl font-bold text-ink mt-1">
                Tạo tin tuyển dụng có Bảo vệ Pháp lý
              </h2>
            </div>

            {/* AI Compliance Guard Live Meter */}
            <div className="p-4 rounded-xl bg-paper-2 border border-rule flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald" />
                  <span>Trợ lý Tuân thủ AI (Bộ luật Lao động 2019)</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald">100% HỢP CHUẨN</span>
              </div>
              <ul className="text-[11px] text-ink-2 space-y-1 font-mono">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald font-bold">✓</span>
                  <span>Mức lương công khai minh bạch (không ghi thỏa thuận vô thời hạn)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald font-bold">✓</span>
                  <span>Cam kết trả lương làm thêm giờ theo Điều 98 (150% - 300%)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald font-bold">✓</span>
                  <span>Trần lương và thời hạn thử việc tối đa 60 ngày theo Điều 25</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleCreateJob} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-ink-2 block mb-1">
                  Chức danh tuyển dụng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kỹ sư Backend Go / Python Cấp cao"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-2 border border-rule font-body text-xs text-ink focus:outline-2 focus:outline-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs uppercase font-bold text-ink-2 block mb-1">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-2 border border-rule font-body text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase font-bold text-ink-2 block mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-paper-2 border border-rule font-body text-xs text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase font-bold text-ink-2 block mb-1">
                  Mức lương dự kiến (VND / tháng)
                </label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-2 border border-rule font-body text-xs text-ink"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase font-bold text-ink-2 block mb-1">
                  Mô tả công việc & Yêu cầu
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tech stack, kinh nghiệm yêu cầu và trách nhiệm chính..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper-2 border border-rule font-body text-xs text-ink"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-rule text-xs font-semibold hover:bg-paper-2"
                >
                  Hủy
                </button>
                <button type="submit" className="btn !h-9 !px-6 text-xs font-bold cursor-pointer">
                  <span>Đăng tin đã xác thực →</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
