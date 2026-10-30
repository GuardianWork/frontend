import { useAuthUser } from "@/hooks/useAuthUser";
import {
  JobIcon,
  LegalReferenceIcon,
  CandidateProfileIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { GuardianIllustration } from "@/components/GuardianIllustration";
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
  const user = useAuthUser();
  return (
    <AdminShell title="Candidate Portal" role="candidate">
      {/* Header */}
      <div className="guardian-welcome mb-8">
        <div className="guardian-welcome__content">
          <div>
            <h1 className="text-3xl md:text-3xl font-bold text-charcoal-text tracking-tight mb-2">
              Chào mừng bạn đến với Cổng ứng viên
            </h1>
            <p className="text-base text-charcoal-83 max-w-2xl">
              Tìm việc làm đa ngành đã kiểm định 100% hợp đồng, tra cứu quyền lợi pháp lý với AI
              Copilot và quản lý hồ sơ ẩn danh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
            >
              <JobIcon size={16} />
              <span>Xem Việc Làm Đã Thẩm Định</span>
            </Link>
          </div>
        </div>
        <GuardianIllustration name="growth" className="guardian-art--welcome" desktopOnly />
      </div>

      {/* 3 Quick Cards */}
      <div className="workspace-shortcuts mb-8">
        <Link to="/jobs" className="group flex flex-col justify-between gap-4">
          <div>
            <div className="text-primary mb-3">
              <JobIcon size={24} />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">Kho Việc Làm Đã Thẩm Định</h3>
            <p className="text-sm text-charcoal-83 leading-relaxed mb-4">
              Khám phá việc làm từ các công ty cam kết không vi phạm Điều 98 làm thêm giờ và trần
              thử việc Điều 25.
            </p>
          </div>
          <div className="text-sm font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Truy cập 6 vị trí đang mở</span>
            <ArrowRightIcon size={16} />
          </div>
        </Link>

        <Link to="/candidate/copilot" className="group flex flex-col justify-between gap-4">
          <div>
            <div className="text-primary mb-3">
              <LegalReferenceIcon size={24} />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">AI Legal Copilot</h3>
            <p className="text-sm text-charcoal-83 leading-relaxed mb-4">
              Tra cứu luật lao động tức thì: quy định thử việc 60 ngày, tiền lương làm thêm giờ
              150%-300%, và cấm phạt tiền thay kỷ luật.
            </p>
          </div>
          <div className="text-sm font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Hỏi đáp cùng AI Pháp lý</span>
            <ArrowRightIcon size={16} />
          </div>
        </Link>

        <Link to="/candidate/profile" className="group flex flex-col justify-between gap-4">
          <div>
            <div className="text-primary mb-3">
              <CandidateProfileIcon size={24} />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">Hồ Sơ Năng Lực Của Bạn</h3>
            <p className="text-sm text-charcoal-83 leading-relaxed mb-4">
              Cập nhật mức lương kỳ vọng, tệp CV đã xác thực chứng chỉ IELTS và bảo vệ quyền sở hữu
              trí tuệ ngoài giờ.
            </p>
          </div>
          <div className="text-sm font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Quản lý hồ sơ{user?.firstName ? ` của ${user.firstName}` : " của bạn"}</span>
            <ArrowRightIcon size={16} />
          </div>
        </Link>
      </div>

      {/* Statutory Banner */}
      <div className="bg-parchment-bg border border-warm-border p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon name="shield" className="text-primary !text-3xl shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-charcoal-text">
              Quyền lợi người lao động theo Bộ luật Lao động 2019
            </h4>
            <p className="text-sm text-charcoal-83 mt-1 leading-relaxed">
              Bạn có quyền từ chối các điều khoản không đúng luật: Giữ bằng cấp gốc, thử việc quá 60
              ngày cho vị trí kỹ sư đại học, hoặc không thanh toán lương làm thêm giờ thỏa đáng.
            </p>
          </div>
        </div>
        <Link
          to="/candidate/copilot"
          className="px-4 py-2 bg-paper-white border border-warm-border rounded-lg text-sm font-bold text-charcoal-text hover:bg-surface-container transition-colors shrink-0 shadow-xs"
        >
          Tìm hiểu điều khoản
        </Link>
      </div>
    </AdminShell>
  );
}
