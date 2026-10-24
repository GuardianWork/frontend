import { createFileRoute } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { JobManagementPanel } from "@/components/admin/JobManagementPanel";

export const Route = createFileRoute("/staff/jobs")({
  head: () => ({ meta: [{ title: "Quản lý tin tuyển dụng — Platform staff GuardianWork" }] }),
  component: () => (
    <AdminShell title="Quản lý tin tuyển dụng" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Quản lý tin tuyển dụng</h1>
          <p>Duyệt tin chờ đăng, quản lý hiển thị và kiểm tra các nội dung AI gắn cờ.</p>
        </div>
        <span className="admin-draft-label admin-sample-label">
          <Database size={14} aria-hidden="true" /> Dữ liệu minh họa
        </span>
      </div>
      <div className="admin-sample-banner" role="note">
        <Database size={18} aria-hidden="true" />
        <p>
          Tin tuyển dụng và kết quả AI là dữ liệu mẫu. Thao tác duyệt, từ chối và thay đổi hiển thị
          chỉ áp dụng trong màn hình này, chưa ghi lên hệ thống.
        </p>
      </div>
      <JobManagementPanel />
    </AdminShell>
  ),
});
