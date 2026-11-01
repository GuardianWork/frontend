import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/rec/talent")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Hồ sơ ứng viên — GuardianWork Recruiter" },
      {
        name: "description",
        content: "Danh sách hồ sơ ứng viên minh họa theo chuyên môn và địa điểm.",
      },
    ],
  }),
  component: RecruiterTalentPage,
});

function RecruiterTalentPage() {
  const [query, setQuery] = useState("");
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
      status: "Hồ sơ minh họa",
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
      status: "Hồ sơ minh họa",
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
      status: "Hồ sơ minh họa",
    },
  ];

  const current = candidatesList.find((c) => c.id === selectedCandidateId) || candidatesList[0];

  return (
    <AdminShell title="Hồ sơ ứng viên" role="recruiter">
      {/* Header */}
      <div className="workspace-heading">
        <div>
          <h1 className="text-3xl md:text-3xl font-bold text-charcoal-text mb-2 tracking-tight">
            Danh sách hồ sơ ứng viên
          </h1>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Khám phá danh sách hồ sơ minh họa theo chuyên môn, kinh nghiệm và địa điểm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/rec"
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="hub" className="!text-base text-primary" />
            <span>Quay lại tổng quan tuyển dụng</span>
          </Link>
          <button
            onClick={() => setPitchSent(true)}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="mail" className="!text-base" />
            <span>
              {pitchSent
                ? `Đã ghi nhận thao tác mẫu: ${current.name}`
                : "Gửi Outreach Pitch (Bảo Mật)"}
            </span>
          </button>
        </div>
      </div>

      <details open className="workspace-data-note">
        <summary>Hồ sơ và thao tác minh họa</summary>
        <p>
          Hồ sơ ứng viên, thông tin kiểm định và thao tác tiếp cận trên trang này là minh họa. Thao
          tác không gửi tin nhắn tới ứng viên.
        </p>
      </details>
      {/* KPI Stats Row */}
      <div className="workspace-summary">
        <div className="workspace-summary__item">
          <span className="font-semibold text-charcoal-40 text-sm block mb-2">
            Mức lương tham khảo
          </span>
          <div className="font-semibold text-2xl text-charcoal-text ">{current.salary}</div>
          <div className="mt-2 text-sm text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="payments" className="!text-[15px] text-primary" /> Cam kết hợp đồng chính
            thức
          </div>
        </div>

        <div className="workspace-summary__item">
          <span className="font-semibold text-charcoal-40 text-sm block mb-2">
            Kinh nghiệm Tích lũy
          </span>
          <div className="font-semibold text-2xl text-charcoal-text ">{current.experience}</div>
          <div className="mt-2 text-sm text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="history_edu" className="!text-[15px] text-primary" /> Backend, K8s & Design
            Systems
          </div>
        </div>

        <div className="workspace-summary__item">
          <span className="font-semibold text-charcoal-40 text-sm block mb-2">Nguồn hồ sơ</span>
          <div className="font-semibold text-2xl ">Hồ sơ minh họa</div>
          <div className="mt-2 text-sm text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="shield" className="!text-[15px]" /> Bảo vệ theo Điều 98 & Điều 25
          </div>
        </div>
      </div>

      <ListSearch
        value={query}
        onChange={setQuery}
        label="Tìm ứng viên, chuyên môn hoặc địa điểm"
        count={
          candidatesList.filter((c) => matchesSearch(query, c.name, c.role, c.location)).length
        }
      />
      {/* Split Grid */}
      <div className="workspace-split">
        {/* Left Pane: Candidates list & Active Card */}
        <div className="workspace-profile-sidebar">
          {/* Candidate selector pills */}
          <div className="workspace-result-list">
            <span className="text-xs font-bold text-charcoal-40 px-1">Chọn hồ sơ ứng viên</span>
            <div className="flex flex-col gap-1.5">
              {!candidatesList.some((c) => matchesSearch(query, c.name, c.role, c.location)) && (
                <p className="p-3 text-sm text-charcoal-83">Không tìm thấy hồ sơ phù hợp.</p>
              )}
              {candidatesList
                .filter((c) => matchesSearch(query, c.name, c.role, c.location))
                .map((c) => {
                  const active = c.id === current.id;
                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedCandidateId(c.id);
                          setPitchSent(false);
                        }
                      }}
                      onClick={() => {
                        setSelectedCandidateId(c.id);
                        setPitchSent(false);
                      }}
                      className={
                        active
                          ? "workspace-result is-selected flex items-center justify-between gap-3"
                          : "workspace-result flex items-center justify-between gap-3"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary font-semibold"
                        >
                          {c.name.slice(0, 1)}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-charcoal-text">{c.name}</div>
                          <div className="text-xs text-charcoal-83">{c.role}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
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
                <span
                  aria-hidden="true"
                  className="flex h-full items-center justify-center bg-surface-container text-primary font-semibold text-xl"
                >
                  {current.name.slice(0, 1)}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-charcoal-text">{current.name}</h3>
                <p className="text-sm font-medium text-charcoal-83 mt-0.5">{current.role}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-700">
                    Verified Active Candidate
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-warm-border text-sm">
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-sm font-semibold ">Địa điểm:</span>
                <span className="text-charcoal-text font-medium">{current.location}, Việt Nam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-sm font-semibold ">Định danh:</span>
                <span className="text-charcoal-text font-medium text-sm">
                  Đã xác thực CCCD điện tử
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-sm font-semibold ">Ngoại ngữ:</span>
                <span className="text-green-700 text-sm font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
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
              <span className="px-2 py-0.5 bg-primary text-on-primary text-xs font-bold rounded">
                PDF
              </span>
            </div>
            <p className="text-sm text-charcoal-83 break-words mb-3">
              {current.name.replace(/[^a-zA-Z]/g, "_")}_CV_2026_Verified.pdf
            </p>
            <button
              disabled
              title="Tệp CV trong hồ sơ minh họa chưa có tài liệu để tải về"
              className="w-full py-2 bg-surface-container border border-warm-border rounded-lg text-sm font-semibold text-charcoal-83 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name="download" className="!text-base" /> Tải tệp CV bản đã thẩm định
            </button>
          </div>
        </div>

        {/* Right Pane: Review & Detailed Experience */}
        <div className="workspace-detail-column">
          <div className="workspace-detail">
            {/* Header */}
            <div className="workspace-detail-header">
              <div>
                <h3 className="text-lg font-bold text-charcoal-text">
                  Chi tiết Năng lực & Đánh giá Sourcing
                </h3>
                <p className="text-sm text-charcoal-83 font-medium">
                  Hồ sơ ID: #{current.id.toUpperCase()}-VERIFIED
                </p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold flex items-center gap-1">
                <Icon name="verified" className="!text-sm" /> 100% Verified
              </span>
            </div>

            {/* Scrollable details */}
            <div className="workspace-prose">
              {/* Statutory Protection Banner */}
              <div className="workspace-reference-note flex gap-4">
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
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Icon name="policy" className="!text-sm" /> Tuân thủ Bộ luật Lao động 2019
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <h4 className="font-semibold text-sm text-charcoal-40 mb-2">
                  Tóm Tắt Năng Lực Ứng Viên
                </h4>
                <p className="text-sm text-charcoal-text leading-relaxed">
                  Kỹ sư có bề dày chuyên môn về hệ thống phân tán và ứng dụng hiệu năng cao. Có kinh
                  nghiệm xây dựng các giải pháp chịu tải hàng triệu người dùng, dẫn dắt đội ngũ kỹ
                  thuật và duy trì tuân thủ an toàn bảo mật.
                </p>
              </div>

              {/* Core Skills */}
              <div>
                <h4 className="font-semibold text-sm text-charcoal-40 mb-3">
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
                      className="px-3 py-1 rounded-md bg-surface-container border border-warm-border text-sm font-semibold text-charcoal-text"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work history */}
              <div>
                <h4 className="font-semibold text-sm text-charcoal-40 mb-3">
                  Kinh Nghiệm Thực Tế Xác Thực
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-sm text-charcoal-text">
                          Senior Tech Lead & Systems Engineer
                        </h5>
                        <p className="text-sm text-charcoal-83 mt-0.5 font-medium">
                          GuardianWork VN • TP. Hồ Chí Minh
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">2023 – Hiện tại</span>
                    </div>
                    <p className="text-sm text-charcoal-83 mt-2 leading-relaxed">
                      Dẫn dắt kiến trúc bảo mật tuân thủ Bộ luật Lao động 2019, điều phối vi dịch vụ
                      và triển khai hệ thống xác thực tức thì cho hơn 5.000 ứng viên.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-sm text-charcoal-text">
                          Lead Frontend Systems Architect
                        </h5>
                        <p className="text-sm text-charcoal-83 mt-0.5 font-medium">
                          Apex Cloud Services • Remote APAC
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">2020 – 2023</span>
                    </div>
                    <p className="text-sm text-charcoal-83 mt-2 leading-relaxed">
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
                  <p className="text-sm text-charcoal-83 mt-0.5">
                    Lời mời được gắn nhãn hợp đồng bảo vệ Điều 98
                  </p>
                </div>
                <button
                  onClick={() => setPitchSent(true)}
                  className="px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-lg hover:opacity-90 transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Icon name="send" className="!text-base" />
                  <span>{pitchSent ? "Đã gửi Pitch " : "Gửi Lời Mời Ngay"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
