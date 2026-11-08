import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StaffAccount } from "@/components/admin/StaffAccount";
import { JOB_SAMPLE_RECORDS } from "@/lib/staff-jobs";
import { AREAS } from "@/components/admin/AdminDraftPage";
import { dossierDate } from "@/lib/dossier-date";
import "@/components/admin/staff-overview.css";
import { getAdminVerifications, type VerificationPage } from "@/services/adminCompanies";

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
  const [verifications, setVerifications] = useState<VerificationPage | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
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
      if (!signal.aborted) {
        setVerifications(result);
        setUpdatedAt(new Date());
      }
    } catch {
      if (!signal.aborted) {
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
      <div className="staff-overview">
        <div className="admin-page-heading">
          <div>
            <h1>Tổng quan kiểm duyệt</h1>
            <p aria-live="polite">
              {loading
                ? "Đang kiểm tra hồ sơ cần xử lý…"
                : verificationError
                  ? "Chưa cập nhật được hàng đợi. Kiểm tra lại trước khi xử lý."
                  : verifications?.totalElements
                    ? `Có ${verifications.totalElements.toLocaleString("vi-VN")} hồ sơ công ty đang chờ bạn kiểm tra.`
                    : "Không có hồ sơ công ty đang chờ xác minh."}
            </p>
          </div>
          <Link to="/staff/audit-logs" className="admin-text-link">
            Lịch sử hoạt động của tôi <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="staff-overview-grid">
          <section className="staff-overview-queue" aria-labelledby="overview-verifications">
            <div className="staff-overview-section-heading">
              <h2 id="overview-verifications">Xác minh công ty</h2>
              <button
                type="button"
                className="admin-text-link"
                disabled={loading}
                onClick={() => setReload((value) => value + 1)}
              >
                <RefreshCw size={14} aria-hidden="true" />
                {loading ? "Đang tải…" : "Tải lại hồ sơ"}
              </button>
            </div>
            <div className="staff-overview-queue-summary" aria-busy={loading}>
              <div>
                <span>Hồ sơ chờ xác minh</span>
                <strong>
                  {verifications ? verifications.totalElements.toLocaleString("vi-VN") : "—"}
                </strong>
                <p>
                  {loading
                    ? "Đang tải hồ sơ…"
                    : updatedAt
                      ? `Cập nhật ${updatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                      : "Chưa có dữ liệu"}
                </p>
              </div>
              <Link
                to="/staff/verifications"
                search={{ status: "PENDING", page: 0 }}
                className="admin-primary-action"
              >
                Xem hồ sơ chờ xác minh <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {verificationError && (
              <div className="staff-overview-error" role="alert">
                <p>
                  Không tải được hồ sơ.
                  {verifications ? " Đang hiển thị dữ liệu lần tải trước." : " Vui lòng thử lại."}
                </p>
                <button
                  type="button"
                  className="admin-text-link"
                  onClick={() => setReload((value) => value + 1)}
                >
                  Thử lại
                </button>
              </div>
            )}
            <div className="staff-overview-recent" aria-busy={loading}>
              <h3>Hồ sơ mới gửi</h3>
              {verifications?.content.length ? (
                <ul>
                  {verifications.content.slice(0, 3).map((company) => (
                    <li key={company.id}>
                      <div>
                        <strong>{company.name}</strong>
                        <span>Mã số thuế {company.taxCode}</span>
                      </div>
                      <time>{dossierDate(company.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="staff-overview-empty" role="status">
                  {loading
                    ? "Đang tải danh sách công ty…"
                    : verificationError
                      ? "Danh sách hồ sơ chưa khả dụng."
                      : "Không có hồ sơ chờ xác minh."}
                </p>
              )}
            </div>
          </section>

          <section className="staff-overview-tools" aria-labelledby="overview-tools">
            <div className="staff-overview-section-heading">
              <h2 id="overview-tools">Không gian làm việc</h2>
            </div>
            <Link to="/staff/jobs" className="staff-overview-tool">
              <div>
                <strong>Tin tuyển dụng</strong>
                <span>Duyệt tin chờ đăng, xem JD và kết quả rà soát AI.</span>
              </div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/staff/reports" className="staff-overview-tool">
              <div>
                <strong>Báo cáo vi phạm</strong>
                <span>Đối chiếu nội dung phản ánh và bằng chứng.</span>
              </div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/staff/accounts" className="staff-overview-tool">
              <div>
                <strong>Tài khoản</strong>
                <span>Kiểm tra người dùng, công ty và quyền truy cập.</span>
              </div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </div>

        <section className="staff-overview-samples" aria-labelledby="overview-samples">
          <div>
            <h2 id="overview-samples">Chỉ số minh họa</h2>
            <p>Các số liệu dưới đây là dữ liệu mẫu, không phản ánh hàng đợi thực tế.</p>
          </div>
          <dl>
            <div>
              <dt>Báo cáo cần xem</dt>
              <dd>
                {reportsNeedingAttention}
                <small> / {reportRows.length} báo cáo mẫu</small>
              </dd>
            </div>
            <div>
              <dt>Tin cần chú ý</dt>
              <dd>
                {jobsNeedingAttention}
                <small> / {jobRows.length} tin mẫu</small>
              </dd>
            </div>
            <div>
              <dt>Tài khoản cần chú ý</dt>
              <dd>
                {accountsNeedingAttention}
                <small> / {accountRows.length} tài khoản mẫu</small>
              </dd>
            </div>
          </dl>
        </section>
        <StaffAccount summary />
      </div>
    </AdminShell>
  );
}
