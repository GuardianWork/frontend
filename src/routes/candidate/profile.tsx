import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/profile")({
  head: () => ({
    meta: [
      { title: "My Talent Profile & Safeguards — GuardianWork" },
      {
        name: "description",
        content:
          "Manage your verified developer profile, salary floor, skills, and statutory protections.",
      },
    ],
  }),
  component: CandidateProfilePage,
});

function CandidateProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [salaryFloor, setSalaryFloor] = useState(
    "150 triệu VND/tháng ($6,000/tháng) hoặc tương đương + Cổ phần",
  );
  const [titleRole, setTitleRole] = useState("Kỹ sư Hệ thống & Full-Stack Cấp cao");

  return (
    <AdminShell title="My Talent Profile" role="candidate">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Hồ Sơ Năng Lực & Quyền Lợi Bảo Vệ
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Hồ sơ kỹ sư công nghệ của bạn đã kiểm định danh tính và được bảo vệ theo Bộ luật Lao
            động 2019.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="edit" className="!text-base" />
            <span>{isEditing ? "Đóng chỉnh sửa" : "Chỉnh sửa hồ sơ"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Mức lương Kỳ vọng
          </span>
          <div className="font-semibold text-2xl text-charcoal-text font-mono">150M VND / mo</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="payments" className="!text-[15px] text-primary" /> $6,000/tháng + Cổ phần
            ESOP
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm">
          <span className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider block mb-2">
            Kinh nghiệm Tích lũy
          </span>
          <div className="font-semibold text-2xl text-charcoal-text font-mono">
            8 Năm Chuyên sâu
          </div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center gap-1 font-medium">
            <Icon name="history_edu" className="!text-[15px] text-primary" /> Backend, K8s &
            Frontend Architecture
          </div>
        </div>

        <div className="bg-primary text-on-primary border border-primary rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
            <Icon name="verified_user" className="!text-7xl translate-x-3 translate-y-3" />
          </div>
          <span className="font-semibold text-on-primary/80 text-xs uppercase tracking-wider block mb-2">
            Lá chắn Pháp lý
          </span>
          <div className="font-semibold text-2xl font-mono">100% Đã Kiểm định</div>
          <div className="mt-2 text-xs text-on-primary/90 flex items-center gap-1 font-medium">
            <Icon name="shield" className="!text-[15px]" /> Bảo vệ theo Điều 98 & Điều 25
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Candidate Info & Links */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Candidate Card */}
          <div className="bg-paper-white p-6 rounded-xl border border-warm-border shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-warm-border bg-surface-container shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=NguyenVanAn(Alex)"
                  alt="Alex"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div>
                <h3 className="font-bold text-xl text-charcoal-text">Nguyen Van An (Alex)</h3>
                <p className="text-sm font-medium text-charcoal-83 mt-0.5">{titleRole}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-green-700">
                    Verified Active Candidate
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields if toggled */}
            {isEditing && (
              <div className="mb-4 p-4 rounded-lg bg-surface-container-low border border-warm-border space-y-3">
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={titleRole}
                    onChange={(e) => setTitleRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-paper-white border border-warm-border rounded text-xs text-charcoal-text"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                    Lương mong muốn
                  </label>
                  <input
                    type="text"
                    value={salaryFloor}
                    onChange={(e) => setSalaryFloor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-paper-white border border-warm-border rounded text-xs text-charcoal-text"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-warm-border text-sm">
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Địa điểm:</span>
                <span className="text-charcoal-text font-medium">TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Email:</span>
                <span className="text-charcoal-text font-medium font-mono text-xs">
                  an.nguyen@guardianwork.vn
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">
                  Điện thoại:
                </span>
                <span className="text-charcoal-text font-medium font-mono text-xs">
                  +84 987 654 321
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-charcoal-40 text-xs font-semibold uppercase">Năm sinh:</span>
                <span className="text-charcoal-text font-medium font-mono text-xs">1996</span>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-sm">
            <h4 className="font-semibold text-sm text-charcoal-text mb-3 flex items-center gap-2">
              <Icon name="translate" className="!text-base text-primary" />
              Ngoại ngữ Đã Xác thực
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-low border border-warm-border">
                <span className="font-medium text-charcoal-text">Tiếng Anh (Professional)</span>
                <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  IELTS 7.5
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-low border border-warm-border">
                <span className="font-medium text-charcoal-text">Tiếng Việt</span>
                <span className="font-mono text-xs font-bold text-charcoal-83 bg-surface-container px-2 py-0.5 rounded">
                  Bản ngữ
                </span>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-sm">
            <h4 className="font-semibold text-sm text-charcoal-text mb-3 flex items-center gap-2">
              <Icon name="link" className="!text-base text-primary" />
              Liên kết Mã nguồn & Hồ sơ
            </h4>
            <div className="space-y-2 text-sm font-mono text-xs">
              <a
                href="https://github.com/alex-dev"
                target="_blank"
                rel="noreferrer"
                className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-warm-border transition-colors text-charcoal-text"
              >
                <span>GitHub</span>
                <span className="text-primary font-semibold flex items-center gap-1">
                  github.com/alex-dev <Icon name="open_in_new" className="!text-[13px]" />
                </span>
              </a>
              <a
                href="https://linkedin.com/in/alex-dev"
                target="_blank"
                rel="noreferrer"
                className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-warm-border transition-colors text-charcoal-text"
              >
                <span>LinkedIn</span>
                <span className="text-primary font-semibold flex items-center gap-1">
                  linkedin.com/in/alex-dev <Icon name="open_in_new" className="!text-[13px]" />
                </span>
              </a>
            </div>
          </div>

          {/* Attached Verified CV */}
          <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-charcoal-text flex items-center gap-2">
                <Icon name="description" className="!text-base text-primary" />
                CV Đính kèm
              </span>
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded">
                PDF
              </span>
            </div>
            <p className="font-mono text-xs text-charcoal-83 truncate mb-3">
              Nguyen_Van_An_CV_2026_Verified.pdf
            </p>
            <button className="w-full py-2 bg-surface-container border border-warm-border hover:bg-surface-container-high rounded-lg text-xs font-semibold text-charcoal-text flex items-center justify-center gap-1.5 transition-colors">
              <Icon name="download" className="!text-base" /> Tải tệp CV đã xác thực
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
                  Chi tiết Năng lực & Kinh nghiệm
                </h3>
                <p className="text-sm text-charcoal-83 font-medium">Hồ sơ ID: #SEEKER-VN-8842</p>
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
                    Thông tin liên hệ của ứng viên chỉ được gửi tới Nhà tuyển dụng sau khi hai bên
                    xác nhận quan tâm chung. Quyền sở hữu trí tuệ đối với các dự án mã nguồn mở
                    ngoài giờ làm việc được bảo hộ 100%.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Icon name="policy" className="!text-sm" /> Tuân thủ Bộ luật Lao động 2019
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-2">
                  Giới thiệu Bản thân
                </h4>
                <p className="text-sm text-charcoal-text leading-relaxed bg-surface-container-low p-4 rounded-lg border border-warm-border">
                  Kỹ sư hệ thống và kỹ sư sản phẩm với hơn 8 năm kinh nghiệm xây dựng các kiến trúc
                  phân tán chịu tải cao và giao diện người dùng mượt mà. Kết nối hạ tầng DevOps với
                  ứng dụng web, tập trung vào khả năng mở rộng, độ tin cậy và tuân thủ bảo mật cấp
                  doanh nghiệp.
                </p>
              </div>

              {/* Core Skills */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3">
                  Kỹ năng Nổi bật
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
                  Lịch sử Công tác
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
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
