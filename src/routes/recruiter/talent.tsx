import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/recruiter/talent")({
  head: () => ({
    meta: [
      { title: "Talent Profiles & Audit — GuardianWork Recruiter" },
      {
        name: "description",
        content:
          "Inspect verified candidate talent profiles, audited skills, and statutory compliance safeguards.",
      },
    ],
  }),
  component: RecruiterTalentPage,
});

function RecruiterTalentPage() {
  const [pitchSent, setPitchSent] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("seeker-1");

  const candidatesList = [
    {
      id: "seeker-1",
      name: "Nguyen Van An (Alex)",
      role: "Kỹ sư Hệ thống & Full-Stack Cấp cao",
      salary: "150M VND / mo ($6,000)",
      experience: "8 năm Chuyên sâu",
      ielts: "IELTS 7.5",
      location: "TP. Hồ Chí Minh",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=NguyenVanAn(Alex)",
      status: "100% Đã Kiểm Định",
    },
    {
      id: "seeker-2",
      name: "Tran Minh Tri (Michael)",
      role: "Kỹ sư Nền tảng Go & Kubernetes",
      salary: "110M VND / mo ($4,400)",
      experience: "6 năm K8s & Cloud",
      ielts: "TOEIC 920",
      location: "Hà Nội",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelTran",
      status: "Điều 98 Verified",
    },
    {
      id: "seeker-3",
      name: "Le Hoang Nam",
      role: "Kỹ sư Di động React Native Cấp cao",
      salary: "90M VND / mo ($3,600)",
      experience: "5 năm Mobile Apps",
      ielts: "IELTS 7.0",
      location: "Đà Nẵng / Hybrid",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=LeHoangNam",
      status: "100% Đã Kiểm Định",
    },
  ];

  const current = candidatesList.find((c) => c.id === selectedCandidateId) || candidatesList[0];

  return (
    <AdminShell title="Talent Profiles & Audit" role="recruiter">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Talent Profiles Directory
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Danh mục hồ sơ kỹ sư công nghệ đã qua kiểm định KYC, chứng chỉ ngoại ngữ và mức lương
            sàn minh bạch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter"
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="hub" className="!text-base text-primary" />
            <span>Quay lại Recruiter Hub</span>
          </Link>
          <button
            onClick={() => setPitchSent(true)}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon name="mail" className="!text-base" />
            <span>{pitchSent ? "Đã gửi Pitch đến Alex ✓" : "Gửi Outreach Pitch (Bảo Mật)"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Mức lương Sàn Yêu cầu
          </span>
          <div className="font-semibold text-2xl text-charcoal-text font-mono">
            {current.salary}
          </div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="payments" className="!text-[15px] text-primary" /> Cam kết hợp đồng chính
            thức
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Kinh nghiệm Tích lũy
          </span>
          <div className="font-semibold text-2xl text-charcoal-text font-mono">
            {current.experience}
          </div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="history_edu" className="!text-[15px] text-primary" /> Backend, K8s & Design
            Systems
          </div>
        </div>

        <div className="bg-primary text-on-primary border border-primary rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
            <Icon name="verified_user" className="!text-7xl translate-x-3 translate-y-3" />
          </div>
          <span className="font-semibold text-on-primary/80 text-xs uppercase tracking-wider block mb-2">
            Hợp Chuẩn Pháp Lý
          </span>
          <div className="font-semibold text-2xl font-mono">100% Đã Kiểm Định</div>
          <div className="mt-2 text-xs text-on-primary/90 flex items-center gap-1 font-medium">
            <Icon name="shield" className="!text-[15px]" /> Bảo vệ theo Điều 98 & Điều 25
          </div>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Candidates list & Active Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Candidate selector pills */}
          <div className="bg-paper-white p-3 rounded-xl border border-warm-border flex flex-col gap-2">
            <span className="text-[10px] font-bold text-charcoal-40 uppercase tracking-wider px-1">
              Chọn Hồ Sơ Kỹ Sư Công Nghệ
            </span>
            <div className="flex flex-col gap-1.5">
              {candidatesList.map((c) => {
                const active = c.id === current.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCandidateId(c.id);
                      setPitchSent(false);
                    }}
                    className={
                      active
                        ? "p-3 rounded-lg bg-surface-container border border-primary/40 cursor-pointer flex items-center justify-between"
                        : "p-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-warm-border cursor-pointer transition-colors flex items-center justify-between opacity-80 hover:opacity-100"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-8 h-8 rounded-full border border-warm-border"
                      />
                      <div>
                        <div className="font-bold text-xs text-charcoal-text">{c.name}</div>
                        <div className="text-[11px] text-charcoal-83">{c.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {c.ielts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Candidate Card */}
          <div className="bg-paper-white p-6 rounded-xl border border-warm-border shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-warm-border bg-surface-container shrink-0">
                <img
                  src={current.avatar}
                  alt={current.name}
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div>
                <h3 className="font-bold text-xl text-charcoal-text">{current.name}</h3>
                <p className="text-sm font-medium text-charcoal-83 mt-0.5">{current.role}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-green-700">
                    Verified Active Candidate
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-warm-border text-sm">
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Địa điểm:</span>
                <span className="text-charcoal-text font-medium">{current.location}, Việt Nam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Định danh:</span>
                <span className="text-charcoal-text font-medium font-mono text-xs">
                  Đã xác thực CCCD điện tử
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Ngoại ngữ:</span>
                <span className="text-green-700 font-mono text-xs font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  {current.ielts}
                </span>
              </div>
            </div>
          </div>

          {/* Attached Verified CV */}
          <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-charcoal-text flex items-center gap-2">
                <Icon name="description" className="!text-base text-primary" />
                CV Thẩm Định Đính Kèm
              </span>
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded">
                PDF
              </span>
            </div>
            <p className="font-mono text-xs text-charcoal-83 truncate mb-3">
              {current.name.replace(/[^a-zA-Z]/g, "_")}_CV_2026_Verified.pdf
            </p>
            <button className="w-full py-2 bg-surface-container border border-warm-border hover:bg-surface-container-high rounded-lg text-xs font-semibold text-charcoal-text flex items-center justify-center gap-1.5 transition-colors">
              <Icon name="download" className="!text-base" /> Tải tệp CV bản đã thẩm định
            </button>
          </div>
        </div>

        {/* Right Pane: Review & Detailed Experience */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-warm-border flex justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-charcoal-text">
                  Chi tiết Năng lực & Đánh giá Sourcing
                </h3>
                <p className="text-sm text-charcoal-83 font-medium">
                  Hồ sơ ID: #{current.id.toUpperCase()}-VERIFIED
                </p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
                <Icon name="verified" className="!text-sm" /> 100% Verified
              </span>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              {/* Statutory Protection Banner */}
              <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-5 rounded-lg flex gap-4">
                <Icon name="shield" className="text-primary mt-0.5 !text-2xl shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-text mb-1">
                    Bảo vệ Ẩn danh & Quyền tác giả theo Luật Lao động VN
                  </h4>
                  <p className="text-sm text-charcoal-83 leading-relaxed mb-2">
                    Thông tin liên hệ của ứng viên chỉ được mở cho Nhà tuyển dụng sau khi ứng viên
                    đồng ý tiếp nhận Outreach Pitch. Hợp đồng tuyển dụng phải cam kết thử việc tối
                    đa 60 ngày theo Điều 25 và tính đủ lương làm thêm giờ theo Điều 98.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Icon name="policy" className="!text-sm" /> Tuân thủ Bộ luật Lao động 2019
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-2">
                  Tóm Tắt Năng Lực Ứng Viên
                </h4>
                <p className="text-sm text-charcoal-text leading-relaxed bg-surface-container-low p-4 rounded-lg border border-warm-border">
                  Kỹ sư có bề dày chuyên môn về hệ thống phân tán và ứng dụng hiệu năng cao. Có kinh
                  nghiệm xây dựng các giải pháp chịu tải hàng triệu người dùng, dẫn dắt đội ngũ kỹ
                  thuật và duy trì tuân thủ an toàn bảo mật.
                </p>
              </div>

              {/* Core Skills */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3">
                  Kỹ Năng Đã Thẩm Định Thực Tế
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Go",
                    "Kubernetes",
                    "TypeScript",
                    "React / Next.js",
                    "Distributed Systems",
                    "PostgreSQL",
                    "Tailwind CSS",
                    "SOC2 Security",
                    "gRPC / REST",
                  ].map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-md bg-surface-container border border-warm-border text-xs font-mono font-semibold text-charcoal-text"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work history */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3">
                  Kinh Nghiệm Thực Tế Xác Thực
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-sm text-charcoal-text">
                          Senior Tech Lead & Systems Engineer
                        </h5>
                        <p className="text-xs text-charcoal-83 mt-0.5 font-medium">
                          GuardianWork VN • TP. Hồ Chí Minh
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-primary">
                        2023 – Hiện tại
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-83 mt-2 leading-relaxed">
                      Dẫn dắt kiến trúc bảo mật tuân thủ Bộ luật Lao động 2019, điều phối vi dịch vụ
                      và triển khai hệ thống xác thực tức thì cho hơn 5.000 kỹ sư công nghệ.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-sm text-charcoal-text">
                          Lead Frontend Systems Architect
                        </h5>
                        <p className="text-xs text-charcoal-83 mt-0.5 font-medium">
                          Apex Cloud Services • Remote APAC
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-primary">
                        2020 – 2023
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-83 mt-2 leading-relaxed">
                      Thiết kế design system token và tối ưu hóa thời gian tải ứng dụng web xuống
                      dưới 0.8s cho hơn 50.000 người dùng hàng ngày.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pitch Action Box */}
              <div className="p-5 rounded-xl bg-surface-container-low border border-warm-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-sm text-charcoal-text">
                    Gửi lời mời phỏng vấn đến ứng viên
                  </h5>
                  <p className="text-xs text-charcoal-83 mt-0.5">
                    Lời mời được gắn nhãn hợp đồng bảo vệ Điều 98
                  </p>
                </div>
                <button
                  onClick={() => setPitchSent(true)}
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Icon name="send" className="!text-base" />
                  <span>{pitchSent ? "Đã gửi Pitch ✓" : "Gửi Lời Mời Ngay"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
