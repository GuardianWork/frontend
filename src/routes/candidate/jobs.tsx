import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/jobs")({
  head: () => ({
    meta: [
      { title: "Verified Jobs Queue — GuardianWork Candidate" },
      {
        name: "description",
        content:
          "Review and inspect verified IT roles with Labor Code 2019 legal compliance shields.",
      },
    ],
  }),
  component: CandidateJobsPage,
});

type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  badge: "100% Audited" | "Điều 98 Verified" | "High Salary";
  badgeTone: "primary" | "warning" | "success";
  time: string;
  department: string;
  matchScore: number;
  description: string;
  requirements: string[];
  statutoryBase: string;
  statutoryNote: string;
  suggestedRevision: string;
};

const JOBS: JobItem[] = [
  {
    id: "job-1",
    title: "Kỹ sư Nền tảng Go / Kubernetes Cấp cao",
    company: "Vellum Studio",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 3)",
    salaryRange: "60.000.000 - 85.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 2h trước",
    department: "Kỹ thuật Hạ tầng",
    matchScore: 98,
    description:
      "Chịu trách nhiệm về tính sẵn sàng cao của hệ thống vi dịch vụ backend bằng Go phục vụ hàng triệu người dùng. Tối ưu hóa cụm Kubernetes trên hạ tầng đám mây lai.",
    requirements: [
      "Hơn 4 năm kinh nghiệm phát triển backend bằng Go.",
      "Kinh nghiệm vận hành Kubernetes, Docker và Helm trong môi trường sản xuất.",
      "Hiểu biết sâu sắc về bảo mật API REST/gRPC.",
    ],
    statutoryBase:
      "Điều 98 (Tiền lương làm thêm giờ) & Điều 25 (Thời gian thử việc tối đa 60 ngày)",
    statutoryNote:
      "Hợp đồng lao động quy định rõ ràng mức lương thử việc đạt 85% lương chính thức và cam kết thanh toán làm thêm giờ ít nhất 150% đến 300% theo Bộ luật Lao động 2019.",
    suggestedRevision:
      "Mức lương được niêm yết công khai bằng VND, kèm đóng 100% BHXH, BHYT, BHTN theo mức lương ghi trên hợp đồng chính thức.",
  },
  {
    id: "job-2",
    title: "Lập trình viên Di động React Native",
    company: "Aura Systems",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "45.000.000 - 60.000.000 VND / tháng",
    badge: "Điều 98 Verified",
    badgeTone: "primary",
    time: "Đã kiểm định 4h trước",
    department: "Kỹ thuật Di động",
    matchScore: 94,
    description:
      "Xây dựng giao diện ứng dụng ví điện tử fintech. Tinh chỉnh các hiệu ứng chuyển động mượt mà, xác thực sinh trắc học và tích hợp cổng thanh toán ZaloPay / MoMo.",
    requirements: [
      "Hơn 3 năm kinh nghiệm làm việc với React Native và TypeScript.",
      "Kinh nghiệm tích hợp cổng thanh toán MoMo, ZaloPay hoặc Stripe.",
      "Thành thạo viết native bridge và tối ưu hóa hiệu năng ứng dụng di động.",
    ],
    statutoryBase: "Điều 168 (Bảo hiểm xã hội bắt buộc) & Bảo vệ sở hữu trí tuệ cá nhân",
    statutoryNote:
      "Không có điều khoản phi thực tế về cấm làm việc sau chấm dứt hợp đồng. Quyền sở hữu trí tuệ với các dự án cá nhân ngoài giờ được bảo vệ tuyệt đối.",
    suggestedRevision:
      "Thời gian làm việc từ Thứ Hai đến Thứ Sáu, đảm bảo thời gian nghỉ ngơi tuần theo Điều 111 Bộ luật Lao động 2019.",
  },
  {
    id: "job-3",
    title: "Kiến trúc sư Giải pháp AI / Python",
    company: "Kestrel Analytics",
    location: "Đà Nẵng, Việt Nam (Từ xa / Hybrid)",
    salaryRange: "70.000.000 - 100.000.000 VND / tháng",
    badge: "High Salary",
    badgeTone: "warning",
    time: "Đã kiểm định 6h trước",
    department: "Trí tuệ Nhân tạo",
    matchScore: 91,
    description:
      "Thiết kế các luồng xử lý LLM và phân tích tài liệu tự động. Xây dựng cơ sở dữ liệu vector và mở rộng quy mô các cổng suy luận để phục vụ hàng ngàn yêu cầu đồng thời.",
    requirements: [
      "Hơn 5 năm kinh nghiệm về Python và các luồng xử lý học máy.",
      "Kinh nghiệm với LangChain, LlamaIndex và cơ sở dữ liệu Vector (Milvus, Pinecone).",
      "Kiến thức vững chắc về các mô hình thiết kế vi dịch vụ.",
    ],
    statutoryBase: "Luật Trí tuệ nhân tạo số 134/2025/QH15 & Nghị định 142/2026/NĐ-CP",
    statutoryNote:
      "Tuân thủ các tiêu chuẩn quốc gia về phát triển AI có đạo đức, bảo vệ dữ liệu người dùng và kiểm soát phiên bản mô hình an toàn.",
    suggestedRevision:
      "Hợp đồng làm việc từ xa quy định rõ trang thiết bị làm việc, phụ cấp internet và giờ làm việc linh hoạt theo thỏa ước.",
  },
  {
    id: "job-4",
    title: "Kỹ sư Frontend Trưởng Cấp cao",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 1)",
    salaryRange: "80.000.000 - 110.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 1d trước",
    department: "Kỹ thuật",
    matchScore: 97,
    description:
      "Xây dựng giao diện người dùng cao cấp sử dụng React và TailwindCSS. Hợp tác với đội ngũ thiết kế và sản phẩm để tinh chỉnh các tương tác vi mô và design system token.",
    requirements: [
      "Hơn 5 năm kinh nghiệm làm việc với React và TypeScript.",
      "Quen thuộc với design system token và tương tác UI.",
      "Thành tích tốt trong tối ưu hóa hiệu năng ứng dụng web.",
    ],
    statutoryBase: "Điều 25 & Điều 102 (Thưởng hiệu quả công việc minh bạch)",
    statutoryNote:
      "Chính sách thưởng cổ phiếu ESOP và tháng lương 13 được quy định công khai trong thỏa ước lao động tập thể.",
    suggestedRevision:
      "Cam kết rà soát tăng lương hàng năm và bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.",
  },
  {
    id: "job-5",
    title: "Kiến trúc sư Hạ tầng & DevOps",
    company: "Momo",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "90.000.000 - 125.000.000 VND / tháng",
    badge: "Điều 98 Verified",
    badgeTone: "primary",
    time: "Đã kiểm định 1d trước",
    department: "Kỹ thuật Nền tảng",
    matchScore: 95,
    description:
      "Làm chủ kiến trúc mở rộng và bảo mật của hạ tầng đám mây lai. Điều phối vi dịch vụ, viết các provider Terraform tùy chỉnh và dẫn dắt các chu kỳ tuân thủ SOC2.",
    requirements: [
      "Hơn 8 năm kinh nghiệm về kỹ thuật hệ thống hoặc vận hành.",
      "Kinh nghiệm vững chắc về hệ thống phân tán và Docker Swarm/Kubernetes.",
      "Thành thạo các chính sách bảo mật và tự động hóa hạ tầng.",
    ],
    statutoryBase: "Quy chuẩn an toàn thông tin & Bộ luật Lao động 2019",
    statutoryNote:
      "Chế độ trực on-call ngoài giờ được tính phụ cấp đặc thù theo quy chế nội bộ đã đăng ký với Sở Lao động - Thương binh và Xã hội.",
    suggestedRevision: "Thời gian nghỉ bù 100% cho các phiên bảo trì khẩn cấp vào ban đêm.",
  },
  {
    id: "job-6",
    title: "Kỹ sư Sản phẩm Full-Stack Cấp cao",
    company: "Aura Systems",
    location: "TP. Hồ Chí Minh, Việt Nam (Trung tâm Thủ Đức)",
    salaryRange: "65.000.000 - 90.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 2d trước",
    department: "Kỹ thuật",
    matchScore: 96,
    description:
      "Cần một kỹ sư sản phẩm có tư duy khởi nghiệp để phát triển từ cơ sở dữ liệu đến giao diện người dùng React hoàn chỉnh. Xây dựng các bảng điều khiển tài chính.",
    requirements: [
      "Hơn 5 năm kinh nghiệm với Node.js và React.",
      "Nền tảng vững chắc về cơ sở dữ liệu quan hệ (PostgreSQL/MySQL).",
      "Gu thiết kế tốt và tư duy sản phẩm nhạy bén.",
    ],
    statutoryBase: "Điều 98 & Điều 135 (Môi trường làm việc bình đẳng)",
    statutoryNote:
      "Doanh nghiệp đã hoàn thành quy trình thẩm định KYC và ký cam kết tôn trọng quyền tác giả phần mềm độc lập của kỹ sư.",
    suggestedRevision:
      "Hợp đồng lao động không thời hạn sau khi hoàn thành 02 tháng thử việc đạt yêu cầu.",
  },
];

function badgeStyle(tone: JobItem["badgeTone"]) {
  if (tone === "success") return "bg-green-50 text-green-700 border border-green-200";
  if (tone === "warning") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-surface-container text-charcoal-text border border-warm-border";
}

function CandidateJobsPage() {
  const [selectedId, setSelectedId] = useState(JOBS[0].id);
  const [filter, setFilter] = useState<"all" | "high" | "remote">("all");
  const [appliedList, setAppliedList] = useState<string[]>([]);

  const filteredJobs = JOBS.filter((j) => {
    if (filter === "high") return j.matchScore >= 95;
    if (filter === "remote") return j.location.includes("Từ xa") || j.location.includes("Hybrid");
    return true;
  });

  const activeJob = JOBS.find((j) => j.id === selectedId) || JOBS[0];
  const isApplied = appliedList.includes(activeJob.id);

  const handleApply = (id: string) => {
    if (!appliedList.includes(id)) {
      setAppliedList((prev) => [...prev, id]);
    }
  };

  return (
    <AdminShell title="Verified Jobs Queue" role="candidate">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Verified Jobs Queue
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Các vị trí kỹ thuật IT đã kiểm định tuân thủ Bộ luật Lao động 2019, Điều 98 làm thêm giờ
            và trần thử việc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/candidate/copilot"
            className="px-4 py-2 bg-paper-white border border-warm-border rounded-lg text-sm font-medium text-charcoal-text hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="smart_toy" className="!text-lg text-primary" />
            <span>AI Legal Check</span>
          </Link>
          <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>6/6 JD Hợp chuẩn 100%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Job list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-paper-white p-3 rounded-xl border border-warm-border">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Tất cả ({JOBS.length})
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "high"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Match cao (&gt;95%)
              </button>
              <button
                onClick={() => setFilter("remote")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "remote"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Từ xa / Hybrid
              </button>
            </div>
            <button className="text-charcoal-83 hover:text-charcoal-text flex items-center gap-1 text-sm font-medium">
              <Icon name="filter_list" className="!text-base" /> Lọc
            </button>
          </div>

          {filteredJobs.map((it) => {
            const isActive = it.id === selectedId;
            const applied = appliedList.includes(it.id);

            return (
              <div
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className={
                  isActive
                    ? "bg-paper-white p-5 rounded-xl border-l-4 border-l-primary border border-warm-border shadow-sm cursor-pointer transition-all"
                    : "bg-paper-white p-5 rounded-xl border border-warm-border hover:shadow-sm transition-shadow cursor-pointer opacity-85 hover:opacity-100"
                }
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight text-charcoal-text">
                      {it.title}
                    </h3>
                    <p className="text-sm text-charcoal-83 mt-0.5 font-medium">
                      {it.company} • {it.location.split("(")[0].trim()}
                    </p>
                  </div>
                  <span
                    className={`font-semibold text-[10px] uppercase tracking-wider px-2 py-1 rounded shrink-0 ${badgeStyle(it.badgeTone)}`}
                  >
                    {it.badge}
                  </span>
                </div>

                <div className="font-mono text-xs font-semibold text-primary mt-2">
                  {it.salaryRange}
                </div>

                <div className="mt-3 pt-3 border-t border-warm-border flex items-center justify-between text-xs text-charcoal-40">
                  <div className="flex items-center gap-1.5 font-medium text-green-700">
                    <Icon name="verified" className="!text-[15px]" />
                    <span>Match: {it.matchScore}%</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {applied ? (
                      <span className="text-green-700 font-semibold flex items-center gap-1">
                        <Icon name="check_circle" className="!text-[14px]" /> Đã ứng tuyển
                      </span>
                    ) : (
                      <span>{it.time}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Review & Audit Detail */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-warm-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-50 text-green-700 border border-green-200">
                    ĐÃ KIỂM ĐỊNH PHÁP LÝ
                  </span>
                  <span className="text-xs font-mono text-charcoal-40">
                    ID: #{activeJob.id.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-charcoal-text mt-1">{activeJob.title}</h3>
                <p className="text-sm text-charcoal-83 font-medium">
                  {activeJob.company} • {activeJob.location}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/candidate/copilot"
                  className="px-3.5 py-2 text-charcoal-text text-xs font-semibold rounded-lg border border-warm-border hover:bg-surface-container transition-colors flex items-center gap-1.5"
                >
                  <Icon name="help" className="!text-base" />
                  <span>Hỏi Luật</span>
                </Link>

                {isApplied ? (
                  <span className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                    <Icon name="check_circle" className="!text-base" />
                    <span>Đã nộp hồ sơ</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(activeJob.id)}
                    className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Icon name="send" className="!text-base" />
                    <span>Ứng tuyển (Bảo vệ Luật định)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              {/* Salary & Match Callout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                  <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Mức lương đề xuất
                  </span>
                  <span className="text-lg font-bold text-charcoal-text block font-mono">
                    {activeJob.salaryRange}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                  <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Độ phù hợp kỹ năng
                  </span>
                  <span className="text-lg font-bold text-green-700 block flex items-center gap-1 font-mono">
                    <Icon name="auto_awesome" className="!text-lg" />
                    {activeJob.matchScore}% tương thích
                  </span>
                </div>
              </div>

              {/* Statutory Base Note */}
              <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-5 rounded-lg flex gap-4">
                <Icon name="gavel" className="text-primary mt-0.5 !text-2xl shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-text mb-1">
                    Căn cứ Pháp lý Kiểm toán: {activeJob.statutoryBase}
                  </h4>
                  <p className="text-sm text-charcoal-83 leading-relaxed mb-2">
                    {activeJob.statutoryNote}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-primary">
                    <span className="flex items-center gap-1">
                      <Icon name="check" className="!text-sm text-green-600" /> Không giữ văn bằng
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="check" className="!text-sm text-green-600" /> Thử việc tối đa 60
                      ngày
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="check" className="!text-sm text-green-600" /> Điều 98 làm thêm giờ
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="description" className="!text-[18px]" />
                  Mô tả Công việc
                </h4>
                <p className="text-sm text-charcoal-text leading-relaxed bg-surface-container-low p-4 rounded-lg border border-warm-border">
                  {activeJob.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="checklist" className="!text-[18px]" />
                  Yêu cầu Trọng tâm
                </h4>
                <ul className="space-y-2 text-sm text-charcoal-text">
                  {activeJob.requirements.map((r, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 bg-paper-white p-3 rounded-lg border border-warm-border"
                    >
                      <Icon
                        name="check_circle"
                        className="!text-base text-primary shrink-0 mt-0.5"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Revision Box */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="verified_user" className="!text-[18px] text-primary" />
                  Quy định Bảo vệ Hợp đồng Thực thi
                </h4>
                <div className="bg-parchment-bg rounded-lg p-5 border border-warm-border">
                  <p className="leading-relaxed text-charcoal-text text-sm font-mono">
                    {activeJob.suggestedRevision}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
