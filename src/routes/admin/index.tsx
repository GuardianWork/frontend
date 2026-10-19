import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { AREAS } from "@/components/admin/AdminDraftPage";
import { getAdminVerifications } from "@/services/adminCompanies";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Tổng quan quản trị — GuardianWork" },
      { name: "description", content: "Tổng quan các chỉ số vận hành và hàng đợi quản trị." },
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
  const jobRows = AREAS.jobs.rows;
  const accountRows = AREAS.accounts.rows;
  const operationsRows = AREAS.monitoring.rows;
  const reportsNeedingAttention = reportRows.filter((row) =>
    ["Mới tiếp nhận", "Đang xem xét"].includes(row.status ?? ""),
  ).length;
  const jobsNeedingAttention = jobRows.filter((row) => row.status === "Đã ẩn").length;
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
          <h1>Tổng quan quản trị</h1>
          <p>Tình hình các hàng đợi quản trị và chỉ số vận hành.</p>
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

      <section className="admin-dashboard-metrics" aria-label="Chỉ số hàng đợi">
        <Link
          to="/admin/verifications"
          search={{ status: "PENDING", page: 0 }}
          className="admin-dashboard-metric"
        >
          <span>Hồ sơ chờ xác minh</span>
          <strong>{loading ? "…" : (pendingVerifications ?? "—")}</strong>
          <small>{verificationError ? "Không tải được dữ liệu" : "Dữ liệu từ API xác minh"}</small>
        </Link>
        <Link to="/admin/reports" className="admin-dashboard-metric">
          <span>Báo cáo cần xem</span>
          <strong>{reportsNeedingAttention}</strong>
          <small>Trong {reportRows.length} báo cáo mẫu</small>
        </Link>
        <Link to="/admin/jobs" className="admin-dashboard-metric">
          <span>Tin cần chú ý</span>
          <strong>{jobsNeedingAttention}</strong>
          <small>Trong {jobRows.length} tin mẫu</small>
        </Link>
        <Link to="/admin/accounts" className="admin-dashboard-metric">
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

      <div className="admin-dashboard-lower">
        <section
          className="admin-panel admin-dashboard-operations"
          aria-labelledby="operations-title"
        >
          <div className="admin-panel-heading">
            <div>
              <h2 id="operations-title">Chỉ số vận hành</h2>
              <p>Dữ liệu minh họa · không phản ánh hệ thống hiện tại</p>
            </div>
            <Link to="/admin/monitoring" className="admin-dashboard-panel-link">
              Chi tiết <ArrowRight size={15} />
            </Link>
          </div>
          <dl className="admin-dashboard-stat-list">
            {operationsRows.map((row) => (
              <div key={row.searchable}>
                <dt>{row.cells[0]}</dt>
                <dd
                  className={
                    row.status === "Cần theo dõi"
                      ? "admin-dashboard-stat-warning"
                      : row.status === "Bình thường"
                        ? "admin-dashboard-stat-good"
                        : undefined
                  }
                >
                  {row.cells[1]}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="admin-dashboard-job-tools" aria-labelledby="job-tools-title">
          <div>
            <h2 id="job-tools-title">Quản lý tin tuyển dụng</h2>
            <p>Quản lý trạng thái tin đã đăng và kiểm tra các JD được AI gắn cờ.</p>
          </div>
          <div>
            <Link to="/admin/jobs">
              Kiểm soát tin <ArrowRight size={15} />
            </Link>
            <Link to="/admin/compliance">
              JD bị AI gắn cờ <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
