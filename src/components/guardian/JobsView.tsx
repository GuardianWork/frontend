import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidate } from "@/context/CandidateContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  ShieldCheck,
  Building2,
  MapPin,
  Banknote,
  Search,
  Bookmark,
  Send,
  Sparkles,
  CheckCircle,
  ExternalLink,
  X,
  FileCheck,
  Scale,
} from "lucide-react";

interface JobItem {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  matchRate: number;
  tags: string[];
  seed: string;
}

const JOBS_DATA: JobItem[] = [
  {
    id: "job-1",
    title: "Kỹ sư Nền tảng Go / Kubernetes Cấp cao",
    company: "Vellum Studio",
    department: "Kỹ thuật Hạ tầng",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 3)",
    salaryRange: "60.000.000 - 85.000.000 VND / tháng",
    description:
      "Chúng tôi tìm kiếm Kỹ sư Nền tảng Go / Kubernetes Cấp cao để chịu trách nhiệm về tính sẵn sàng cao của hệ thống microservices phục vụ hàng triệu người dùng.",
    requirements: [
      "Hơn 4 năm kinh nghiệm phát triển backend bằng Go.",
      "Kinh nghiệm vận hành Kubernetes, Docker và Helm trong môi trường production.",
      "Hiểu biết sâu sắc về bảo mật API REST/gRPC.",
    ],
    matchRate: 98,
    tags: ["Go", "Kubernetes", "Docker", "gRPC"],
    seed: "Vellum Studio",
  },
  {
    id: "job-2",
    title: "Lập trình viên Di động React Native",
    company: "Aura Systems",
    department: "Kỹ thuật Di động",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "45.000.000 - 60.000.000 VND / tháng",
    description:
      "Xây dựng giao diện người dùng cho ứng dụng ví điện tử fintech với các chuyển động mượt mà, xác thực mã bảo mật và trải nghiệm di động cao cấp.",
    requirements: [
      "Hơn 3 năm kinh nghiệm làm việc với React Native và TypeScript.",
      "Kinh nghiệm tích hợp cổng thanh toán (MoMo, ZaloPay hoặc Stripe).",
      "Thành thạo viết native bridge và tối ưu hóa hiệu năng ứng dụng di động.",
    ],
    matchRate: 94,
    tags: ["React Native", "TypeScript", "Fintech", "iOS/Android"],
    seed: "Aura Systems",
  },
  {
    id: "job-3",
    title: "Kiến trúc sư Giải pháp AI / Python",
    company: "Kestrel Analytics",
    department: "Trí tuệ Nhân tạo",
    location: "Đà Nẵng, Việt Nam (Từ xa / Hybrid)",
    salaryRange: "70.000.000 - 100.000.000 VND / tháng",
    description:
      "Thiết kế các luồng xử lý LLM và phân tích tài liệu tự động. Đánh giá độ chính xác của mô hình, xây dựng cơ sở dữ liệu vector và mở rộng quy mô các cổng suy luận.",
    requirements: [
      "Hơn 5 năm kinh nghiệm về Python và các luồng xử lý học máy.",
      "Kinh nghiệm với LangChain, LlamaIndex và cơ sở dữ liệu Vector (Milvus, Pinecone).",
      "Kiến thức vững chắc về các mô hình thiết kế vi dịch vụ.",
    ],
    matchRate: 91,
    tags: ["Python", "LLM", "Vector DB", "RAG"],
    seed: "Kestrel Analytics",
  },
  {
    id: "job-4",
    title: "Kỹ sư Frontend Trưởng Cấp cao",
    company: "VNG Corporation",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 1)",
    salaryRange: "80.000.000 - 110.000.000 VND / tháng",
    description:
      "Xây dựng giao diện người dùng cao cấp sử dụng React và TailwindCSS. Hợp tác với đội ngũ thiết kế và sản phẩm để tinh chỉnh các tương tác vi mô và design system token.",
    requirements: [
      "Hơn 5 năm kinh nghiệm làm việc với React và TypeScript.",
      "Quen thuộc với design system token và tương tác UI.",
      "Thành tích tốt trong tối ưu hóa hiệu năng ứng dụng web.",
    ],
    matchRate: 97,
    tags: ["React", "TypeScript", "Tailwind CSS", "Architecture"],
    seed: "VNG Corporation",
  },
  {
    id: "job-5",
    title: "Kiến trúc sư Hạ tầng & DevOps",
    company: "Momo",
    department: "Kỹ thuật Nền tảng",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "90.000.000 - 125.000.000 VND / tháng",
    description:
      "Làm chủ kiến trúc mở rộng và bảo mật của hạ tầng đám mây lai. Điều phối vi dịch vụ, viết các provider Terraform tùy chỉnh và dẫn dắt các chu kỳ tuân thủ SOC2.",
    requirements: [
      "Hơn 8 năm kinh nghiệm về kỹ thuật hệ thống hoặc vận hành.",
      "Kinh nghiệm vững chắc về hệ thống phân tán và Docker Swarm/Kubernetes.",
      "Thành thạo các chính sách bảo mật và tự động hóa hạ tầng.",
    ],
    matchRate: 95,
    tags: ["DevOps", "Terraform", "Kubernetes", "SOC2"],
    seed: "Momo",
  },
  {
    id: "job-6",
    title: "Kỹ sư Sản phẩm Full-Stack Cấp cao",
    company: "Aura Systems",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh, Việt Nam (Trung tâm Thủ Đức)",
    salaryRange: "65.000.000 - 90.000.000 VND / tháng",
    description:
      "Cần một kỹ sư sản phẩm có tư duy khởi nghiệp để phát triển từ cơ sở dữ liệu đến giao diện người dùng React hoàn chỉnh. Xây dựng các bảng điều khiển tài chính.",
    requirements: [
      "Hơn 5 năm kinh nghiệm với Node.js và React.",
      "Nền tảng vững chắc về cơ sở dữ liệu quan hệ (PostgreSQL/MySQL).",
      "Gu thiết kế tốt và tư duy sản phẩm nhạy bén.",
    ],
    matchRate: 96,
    tags: ["Node.js", "React", "PostgreSQL", "Full-Stack"],
    seed: "Aura Systems",
  },
];

export function JobsView() {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const { profile, appliedJobs, savedJobs, applyJob, saveJob, isApplied, isSaved } = useCandidate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inspectingJob, setInspectingJob] = useState<JobItem | null>(null);
  const [inspectingCompany, setInspectingCompany] = useState<JobItem | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "Tất cả vai trò" },
    { id: "backend", label: "Backend / Go" },
    { id: "frontend", label: "Frontend / React" },
    { id: "mobile", label: "Mobile" },
    { id: "devops", label: "DevOps / K8s" },
    { id: "ai", label: "AI / Python" },
  ];

  const filteredJobs = JOBS_DATA.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === "all") return true;
    if (selectedCategory === "backend") return j.tags.includes("Go") || j.tags.includes("Node.js");
    if (selectedCategory === "frontend") return j.tags.includes("React");
    if (selectedCategory === "mobile")
      return j.tags.includes("React Native") || j.tags.includes("iOS/Android");
    if (selectedCategory === "devops")
      return j.tags.includes("Kubernetes") || j.tags.includes("DevOps");
    if (selectedCategory === "ai") return j.tags.includes("Python") || j.tags.includes("LLM");
    return true;
  });

  const handleApply = (jobId: string) => {
    setApplyingJobId(jobId);
    setTimeout(() => {
      applyJob(jobId);
      setApplyingJobId(null);
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-accent selection:text-accent-ink">
      <Header variant="workbench" />

      {/* Workbench Sub-nav */}
      <div className="border-b border-rule bg-paper-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <Link
              to="/jobs"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold bg-accent text-accent-ink flex items-center gap-1.5 shadow-2xs"
            >
              <span>01</span>
              <span>{dict.navWorkbench.jobs}</span>
            </Link>
            <button
              onClick={() => setInspectingCompany(JOBS_DATA[0])}
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>02</span>
              <span>{dict.navWorkbench.companies}</span>
            </button>
            <Link
              to="/profile"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>03</span>
              <span>{dict.navWorkbench.profile}</span>
            </Link>
            <Link
              to="/copilot"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>04</span>
              <span>{dict.navWorkbench.legalChat}</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-ink-3">
            <span className="w-2 h-2 rounded-full bg-emerald" />
            <span>Xác thực: Bộ luật Lao động 2019</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-paper-2 border border-rule shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-rule bg-paper-3 shrink-0 shadow-sm">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-accent tracking-wider">
                Hồ sơ đã kiểm toán 100%
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">
                Chào mừng trở lại, {profile.name}
              </h1>
              <p className="font-mono text-xs text-ink-3 mt-0.5">
                {profile.role} · {profile.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 rounded-full border border-rule bg-paper hover:bg-paper-3 text-xs font-semibold text-ink transition-colors"
            >
              Xem Hồ sơ →
            </Link>
            <Link
              to="/copilot"
              className="px-4 py-2 rounded-full bg-accent text-accent-ink text-xs font-bold shadow-sm hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Hỏi Trợ lý Luật</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-ink text-paper font-bold"
                    : "bg-paper-2 border border-rule text-ink-2 hover:text-ink hover:bg-paper-3"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-paper-2 border border-rule text-xs font-body text-ink placeholder:text-ink-3 focus:outline-2 focus:outline-accent"
            />
          </div>
        </div>

        {/* Jobs Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const applied = isApplied(job.id);
            const saved = isSaved(job.id);

            return (
              <div
                key={job.id}
                className="rounded-2xl border border-rule bg-paper hover:border-rule-2 hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="flex flex-col gap-3">
                  {/* Top card row: Company and Match rate */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-rule bg-paper-2 shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(job.seed)}`}
                          alt={job.company}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => setInspectingCompany(job)}
                          className="font-bold text-xs text-ink hover:text-accent transition-colors text-left"
                        >
                          {job.company}
                        </button>
                        <div className="font-mono text-[10px] text-ink-3">{job.department}</div>
                      </div>
                    </div>

                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald/15 text-emerald flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {job.matchRate}%
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-lg text-ink leading-snug group-hover:text-accent transition-colors">
                    {job.title}
                  </h3>

                  {/* Meta: Location and Salary */}
                  <div className="flex flex-col gap-1 font-mono text-xs text-ink-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent font-bold">
                      <Banknote className="w-3.5 h-3.5 shrink-0" />
                      <span>{job.salaryRange}</span>
                    </div>
                  </div>

                  {/* Compliance Badges */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-paper-2 border border-rule text-ink-2">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald" />
                      <span>Điều 98 Lương OT</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-paper-2 border border-rule text-ink-2">
                      <FileCheck className="w-2.5 h-2.5 text-emerald" />
                      <span>BHXH 100%</span>
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-paper-2 text-ink-3"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-rule flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => saveJob(job.id)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        saved
                          ? "bg-accent/15 border-accent text-accent"
                          : "bg-paper-2 border-rule text-ink-3 hover:text-ink hover:bg-paper-3"
                      }`}
                      title={saved ? "Đã lưu" : "Lưu vào sổ cái"}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setInspectingJob(job)}
                      className="px-2.5 py-1.5 rounded-lg border border-rule bg-paper-2 hover:bg-paper-3 text-ink-2 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </div>

                  {applied ? (
                    <span className="px-3 py-1.5 rounded-full font-mono text-xs font-bold bg-emerald/20 text-emerald flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã ứng tuyển
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingJobId === job.id}
                      className="btn !h-8 !px-3.5 !text-xs font-bold cursor-pointer"
                    >
                      <span>{applyingJobId === job.id ? "Đang gửi..." : "Ứng tuyển →"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-16 text-ink-3 font-mono text-sm">
            Không tìm thấy vị trí tuyển dụng phù hợp với tìm kiếm của bạn.
          </div>
        )}
      </main>

      {/* Job Details Drawer Modal */}
      {inspectingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-paper border border-rule rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
            <button
              onClick={() => setInspectingJob(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-paper-2 border border-rule text-ink hover:bg-paper-3 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-rule bg-paper-2 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(inspectingJob.seed)}`}
                  alt={inspectingJob.company}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-mono text-xs uppercase font-bold text-accent">
                  {inspectingJob.company} · {inspectingJob.department}
                </span>
                <h2 className="font-display text-2xl font-bold text-ink mt-0.5">
                  {inspectingJob.title}
                </h2>
                <div className="font-mono text-xs text-accent font-bold mt-1">
                  {inspectingJob.salaryRange}
                </div>
              </div>
            </div>

            {/* Compliance Guarantee Shield */}
            <div className="p-4 rounded-xl bg-paper-2 border border-rule flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <ShieldCheck className="w-4 h-4 text-emerald" />
                <span>Cam kết Pháp lý theo Bộ luật Lao động 2019</span>
              </div>
              <ul className="text-xs text-ink-2 space-y-1 font-body">
                <li>• Thử việc tối đa 60 ngày, nhận ít nhất 85% lương chính thức (Điều 25)</li>
                <li>• Trả lương làm thêm giờ ít nhất 150% - 300% (Điều 98)</li>
                <li>• Đóng đủ BHXH, BHYT, BHTN trên mức lương hợp đồng (Điều 168)</li>
              </ul>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-ink-3 mb-2">
                Mô tả công việc
              </h4>
              <p className="font-body text-sm text-ink-2 leading-relaxed">
                {inspectingJob.description}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-ink-3 mb-2">
                Kỹ năng & Yêu cầu
              </h4>
              <ul className="space-y-1.5 text-sm text-ink-2 font-body">
                {inspectingJob.requirements.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-rule flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/copilot"
                className="font-mono text-xs font-bold text-violet bg-violet/10 hover:bg-violet/20 border border-violet/20 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Hỏi AI về JD này</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingJob(null)}
                  className="px-4 py-2 rounded-full border border-rule bg-paper-2 text-ink text-xs font-semibold hover:bg-paper-3 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {isApplied(inspectingJob.id) ? (
                  <span className="px-5 py-2 rounded-full font-mono text-xs font-bold bg-emerald/20 text-emerald flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Đã nộp đơn
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      handleApply(inspectingJob.id);
                      setInspectingJob(null);
                    }}
                    className="btn !h-9 !px-6 !text-xs font-bold cursor-pointer"
                  >
                    <span>Ứng tuyển ngay →</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Preview Modal */}
      {inspectingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-paper border border-rule rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6">
            <button
              onClick={() => setInspectingCompany(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-paper-2 border border-rule text-ink hover:bg-paper-3 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-rule bg-paper-2 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(inspectingCompany.seed)}`}
                  alt={inspectingCompany.company}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald/15 text-emerald border border-emerald/20">
                  Đã Kiểm định Pháp lý 100%
                </span>
                <h3 className="font-display text-2xl font-bold text-ink mt-1">
                  {inspectingCompany.company}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-paper-2 border border-rule">
                <div className="text-ink-3 uppercase text-[10px]">Điểm Tuân thủ TB</div>
                <div className="text-emerald font-bold text-base mt-1">99.4%</div>
              </div>
              <div className="p-3 rounded-xl bg-paper-2 border border-rule">
                <div className="text-ink-3 uppercase text-[10px]">Bảo vệ Điều 98</div>
                <div className="text-ink font-bold text-base mt-1">Cam kết</div>
              </div>
              <div className="p-3 rounded-xl bg-paper-2 border border-rule">
                <div className="text-ink-3 uppercase text-[10px]">Địa bàn hoạt động</div>
                <div className="text-ink font-medium mt-1">Việt Nam & APAC</div>
              </div>
              <div className="p-3 rounded-xl bg-paper-2 border border-rule">
                <div className="text-ink-3 uppercase text-[10px]">Chế độ làm việc</div>
                <div className="text-ink font-medium mt-1">Thứ 2 – Thứ 6</div>
              </div>
            </div>

            <button
              onClick={() => setInspectingCompany(null)}
              className="w-full py-2.5 rounded-full bg-paper-2 border border-rule text-ink text-xs font-bold hover:bg-paper-3 transition-colors cursor-pointer"
            >
              Đóng xem trước
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
