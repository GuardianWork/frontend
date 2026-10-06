import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/")({
  head: () => ({
    meta: [
      { title: "Candidate Portal — GuardianWork" },
      {
        name: "description",
        content:
          "Candidate portal with verified tech jobs, AI legal copilot, and protected talent profile.",
      },
    ],
  }),
  component: CandidateIndexPage,
});

function CandidateIndexPage() {
  return (
    <AdminShell title="Candidate Portal" role="candidate">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-white border border-warm-border font-mono text-xs font-semibold text-charcoal-83 mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Bảo vệ quyền lợi theo Bộ luật Lao động 2019</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text tracking-tight mb-2">
            Chào mừng bạn đến với Cổng Ứng Viên IT
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Tìm việc làm công nghệ đã kiểm định 100% hợp đồng, tra cứu quyền lợi pháp lý với AI
            Copilot và quản lý hồ sơ ẩn danh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/candidate/jobs"
            className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon name="work" className="!text-base" />
            <span>Xem Việc Làm Đã Thẩm Định</span>
          </Link>
        </div>
      </div>

      {/* 3 Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link
          to="/candidate/jobs"
          className="bg-paper-white border border-warm-border hover:border-primary rounded-xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
              <Icon name="work" className="!text-2xl" />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">Kho Việc Làm Đã Thẩm Định</h3>
            <p className="text-xs text-charcoal-83 leading-relaxed mb-4">
              Khám phá các vị trí kỹ thuật từ các công ty cam kết không vi phạm Điều 98 làm thêm giờ
              và trần thử việc Điều 25.
            </p>
          </div>
          <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Truy cập 6 vị trí đang mở</span>
            <Icon name="arrow_forward" className="!text-sm" />
          </div>
        </Link>

        <Link
          to="/candidate/copilot"
          className="bg-paper-white border border-warm-border hover:border-primary rounded-xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
              <Icon name="gavel" className="!text-2xl" />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">AI Legal Copilot</h3>
            <p className="text-xs text-charcoal-83 leading-relaxed mb-4">
              Tra cứu luật lao động tức thì: quy định thử việc 60 ngày, tiền lương làm thêm giờ
              150%-300%, và cấm phạt tiền thay kỷ luật.
            </p>
          </div>
          <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Hỏi đáp cùng AI Pháp lý</span>
            <Icon name="arrow_forward" className="!text-sm" />
          </div>
        </Link>

        <Link
          to="/candidate/profile"
          className="bg-paper-white border border-warm-border hover:border-primary rounded-xl p-6 shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
              <Icon name="badge" className="!text-2xl" />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">Hồ Sơ Năng Lực Của Bạn</h3>
            <p className="text-xs text-charcoal-83 leading-relaxed mb-4">
              Cập nhật mức lương kỳ vọng, tệp CV đã xác thực chứng chỉ IELTS và bảo vệ quyền sở hữu
              trí tuệ ngoài giờ.
            </p>
          </div>
          <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Quản lý hồ sơ của Alex</span>
            <Icon name="arrow_forward" className="!text-sm" />
          </div>
        </Link>
      </div>

      {/* Statutory Banner */}
      <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="text-primary !text-3xl shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-charcoal-text">
              Quyền Lợi Kỹ Sư Công Nghệ Theo Bộ Luật Lao Động 2019
            </h4>
            <p className="text-xs text-charcoal-83 mt-1 leading-relaxed">
              Bạn có quyền từ chối các điều khoản không đúng luật: Giữ bằng cấp gốc, thử việc quá 60
              ngày cho vị trí kỹ sư đại học, hoặc không thanh toán lương làm thêm giờ thỏa đáng.
            </p>
          </div>
        </div>
        <Link
          to="/candidate/copilot"
          className="px-4 py-2 bg-paper-white border border-warm-border rounded-lg text-xs font-bold text-charcoal-text hover:bg-surface-container transition-colors shrink-0 shadow-xs"
        >
          Tìm hiểu điều khoản
        </Link>
      </div>
    </AdminShell>
  );
}
