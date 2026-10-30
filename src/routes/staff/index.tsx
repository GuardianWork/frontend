import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StaffAccount } from "@/components/admin/StaffAccount";
import { JOB_SAMPLE_RECORDS } from "@/lib/staff-jobs";
import { AREAS } from "@/components/admin/AdminDraftPage";
import { getAdminVerifications } from "@/services/adminCompanies";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Tổng quan Platform staff — GuardianWork" },
      {
        name: "description",
        content: "Tổng quan hồ sơ xác minh, báo cáo vi phạm, tin tuyển dụng và tài khoản.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [pendingVerifications, setPendingVerifications] = useState<number | null>(null);
  const [verificationError, setVerificationError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const reportRows = AREAS.reports.rows;
  const jobRows = JOB_SAMPLE_RECORDS;
  const accountRows = AREAS.accounts.rows;
  const reportsNeedingAttention = reportRows.filter((row) =>
    ["Mới tiếp nhận", "Đang xem xét"].includes(row.status ?? ""),
  ).length;
  const jobsNeedingAttention = jobRows.filter((row) =>
    ["PENDING", "HIDDEN"].includes(row.visibility),
  ).length;
  const accountsNeedingAttention = accountRows.filter((row) =>
    ["Tạm khóa", "Chờ xác minh"].includes(row.status ?? ""),
  ).length;

  const loadVerifications = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setVerificationError(false);
    try {
      const result = await getAdminVerifications("PENDING", 0, signal);
      if (!signal.aborted) setPendingVerifications(result.totalElements);
    } catch {
      if (!signal.aborted) {
        setPendingVerifications(null);
        setVerificationError(true);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadVerifications(controller.signal);
    return () => controller.abort();
  }, [loadVerifications, reload]);

  return (
    <AdminShell title="Tổng quan" role="admin">
      <div className="admin-page-heading admin-dashboard-heading">
        <div>
          <h1>Tổng quan Platform staff</h1>
          <p>Theo dõi hồ sơ xác minh, báo cáo vi phạm, tin tuyển dụng và tài khoản.</p>
        </div>
        <span className="admin-dashboard-date">Một phần là dữ liệu mẫu</span>
      </div>

      <div className="admin-dashboard-source" role="note">
        <CircleAlert size={16} aria-hidden="true" />
        <p>
          <strong>Nguồn dữ liệu:</strong> số hồ sơ xác minh lấy từ dịch vụ thật; các chỉ số còn lại
          là dữ liệu minh họa.
        </p>
      </div>

      <section
        className="admin-dashboard-metrics staff-dashboard-metrics"
        aria-label="Chỉ số hàng đợi"
      >
        <Link
          to="/staff/verifications"
          search={{ status: "PENDING", page: 0 }}
          className="admin-dashboard-metric"
          data-kind="verification"
          aria-busy={loading}
        >
          <span>Hồ sơ chờ xác minh</span>
          <strong>{loading ? "…" : (pendingVerifications ?? "—")}</strong>
          <small>{verificationError ? "Không tải được dữ liệu" : "Dữ liệu từ API xác minh"}</small>
        </Link>
        <Link to="/staff/reports" className="admin-dashboard-metric" data-kind="report">
          <span>Báo cáo cần xem</span>
          <strong>{reportsNeedingAttention}</strong>
          <small>Trong {reportRows.length} báo cáo mẫu</small>
        </Link>
        <Link to="/staff/jobs" className="admin-dashboard-metric" data-kind="jobs">
          <span>Tin cần chú ý</span>
          <strong>{jobsNeedingAttention}</strong>
          <small>Trong {jobRows.length} tin mẫu</small>
        </Link>
        <Link to="/staff/accounts" className="admin-dashboard-metric" data-kind="accounts">
          <span>Tài khoản cần chú ý</span>
          <strong>{accountsNeedingAttention}</strong>
          <small>Trong {accountRows.length} tài khoản mẫu</small>
        </Link>
      </section>

      {verificationError && (
        <div className="admin-dashboard-fetch-error" role="status">
          <span>Chưa lấy được số hồ sơ xác minh từ API.</span>
          <button type="button" onClick={() => setReload((value) => value + 1)}>
            <RefreshCw size={14} aria-hidden="true" /> Thử lại
          </button>
        </div>
      )}

      <section className="admin-dashboard-job-tools" aria-labelledby="job-tools-title">
        <div>
          <h2 id="job-tools-title">Quản lý tin tuyển dụng</h2>
          <p>Duyệt tin chờ đăng, quản lý tin đã công khai và kiểm tra các JD được AI gắn cờ.</p>
        </div>
        <div>
          <Link to="/staff/jobs">
            Kiểm soát tin <ArrowRight size={15} />
          </Link>
        </div>
      </section>
      <StaffAccount summary />
    </AdminShell>
  );
}
