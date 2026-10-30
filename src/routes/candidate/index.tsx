import { useAuthUser } from "@/hooks/useAuthUser";
import {
  JobIcon,
  LegalReferenceIcon,
  CandidateProfileIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { useCandidate } from "@/context/CandidateContext";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Candidate Portal — GuardianWork" },
      {
        name: "description",
        content: "Không gian ứng viên để quản lý hồ sơ, CV và tham khảo thông tin lao động.",
      },
    ],
  }),
  component: CandidateIndexPage,
});

function CandidateIndexPage() {
  const user = useAuthUser();
  const { cvs, appliedJobs, savedJobs } = useCandidate();
  return (
    <AdminShell title="Candidate Portal" role="candidate">
      {/* Header */}
      <div className="guardian-welcome mb-8">
        <div className="guardian-welcome__content">
          <div>
            <h1 className="text-3xl md:text-3xl font-bold text-charcoal-text tracking-tight mb-2">
              Không gian ứng viên
            </h1>
            <p className="text-base text-charcoal-83 max-w-2xl">
              Chuẩn bị hồ sơ, tìm vị trí phù hợp và kiểm tra thông tin trước khi ứng tuyển.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
            >
              <JobIcon size={16} />
              <span>Tìm việc làm</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="workspace-summary" aria-label="Hồ sơ và hoạt động">
        {[
          ["CV trong phiên xem", cvs.length],
          ["Đã ứng tuyển trên thiết bị", appliedJobs.length],
          ["Việc đã lưu trong phiên", savedJobs.length],
        ].map(([label, value]) => (
          <div className="workspace-summary__item" key={label}>
            <span>{label}</span>
            <p className="text-2xl">{value}</p>
          </div>
        ))}
      </div>
      <p className="workspace-inline-note">
        CV và thông tin hồ sơ mở rộng hiện lưu trong phiên xem. Thông tin liên hệ sử dụng dịch vụ hồ
        sơ riêng.
      </p>
      {/* Working destinations */}
      <div className="workspace-shortcuts mb-8">
        <Link to="/jobs" className="group flex flex-col justify-between gap-4">
          <div>
            <div className="text-primary mb-3">
              <JobIcon size={24} />
            </div>
            <h3 className="font-bold text-lg text-charcoal-text mb-2">Tìm việc đa ngành</h3>
            <p className="text-sm text-charcoal-83 leading-relaxed mb-4">
              So sánh vị trí, mức lương, địa điểm và yêu cầu tuyển dụng.
            </p>
          </div>
          <div className="text-sm font-bold text-primary flex items-center gap-1 group-hover:underline">
            <span>Khám phá vị trí đang tuyển</span>
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
              Đọc câu hỏi và câu trả lời tham khảo về lao động. Nội dung hiện là bản minh họa soạn
              sẵn.
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
              Cập nhật thông tin liên hệ, kinh nghiệm, học vấn và CV phù hợp với vị trí.
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
