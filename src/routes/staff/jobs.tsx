import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { JobManagementPanel } from "@/components/admin/JobManagementPanel";
import { StaffJobsPanel } from "@/components/admin/StaffJobsPanel";

export const Route = createFileRoute("/staff/jobs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý tin tuyển dụng — Platform staff GuardianWork" },
    ],
  }),
  component: () => (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý tin tuyển dụng</h1>
          <p>Xét duyệt tin tuyển dụng và đối chiếu các dấu hiệu AI với căn cứ pháp luật.</p>
        </div>
      </div>
      <nav className="staff-jobs-section-links" aria-label="Mục trong trang quản lý tin">
        <a href="#staff-reviews">Hàng đợi duyệt tin</a>
        <a href="#staff-legal-ai">Rà soát AI theo pháp luật</a>
      </nav>
      <div id="staff-reviews" className="staff-jobs-page-section">
        <StaffJobsPanel />
      </div>
      <section
        id="staff-legal-ai"
        className="staff-jobs-page-section"
        aria-labelledby="staff-legal-ai-title"
      >
        <div className="admin-panel-heading">
          <h2 id="staff-legal-ai-title">Rà soát AI theo pháp luật</h2>
          <a className="admin-text-link" href="#staff-reviews">
            Về hàng đợi duyệt tin
          </a>
        </div>
        <div className="admin-sample-banner" role="note">
          <p>
            <strong>Kết quả minh họa.</strong> Dữ liệu và kết quả AI dưới đây là mẫu; thao tác chỉ
            thay đổi trong màn hình này. Dịch vụ quét AI chưa được kết nối. Đối chiếu trích đoạn và
            căn cứ pháp luật trước khi xử lý tin.
          </p>
        </div>
        <JobManagementPanel />
      </section>
    </AdminShell>
  ),
});
