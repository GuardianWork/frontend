import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Compliance Insights — GuardianWork Admin" },
      {
        name: "description",
        content:
          "System analytics on Labor Code 2019 compliance audit throughput, Điều 98 violation prevention, and talent flows.",
      },
    ],
  }),
  component: AdminAnalyticsPage,
});

type TimeRange = "7d" | "30d" | "90d" | "1y";

function MetricCard({
  icon,
  label,
  value,
  change,
  positive = true,
  tone = "light",
}: {
  icon: string;
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={
        isDark
          ? "bg-primary text-on-primary rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
          : "bg-paper-white border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between"
      }
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={
            isDark
              ? "p-2 bg-white/10 rounded-lg inline-flex"
              : "p-2 bg-surface-container rounded-lg text-primary inline-flex"
          }
        >
          <Icon name={icon} className="!text-xl" />
        </div>
        <span
          className={
            isDark
              ? "px-2 py-0.5 rounded text-xs font-semibold bg-white/15 text-white flex items-center gap-1 font-mono"
              : positive
                ? "px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 font-mono"
                : "px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 font-mono"
          }
        >
          <Icon name={positive ? "arrow_upward" : "arrow_downward"} className="!text-[12px]" />
          {change}
        </span>
      </div>
      <div>
        <span
          className={
            isDark
              ? "text-xs font-semibold text-on-primary/80 uppercase tracking-wider block mb-1"
              : "text-xs font-semibold text-charcoal-40 uppercase tracking-wider block mb-1"
          }
        >
          {label}
        </span>
        <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  percentage,
  count,
  color = "bg-primary",
}: {
  label: string;
  percentage: number;
  count: string;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-charcoal-text">
        <span>{label}</span>
        <span className="font-mono text-charcoal-40">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden border border-warm-border">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  return (
    <AdminShell title="Analytics & Compliance Insights" role="admin">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Compliance & Pipeline Analytics
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Báo cáo lưu lượng kiểm toán tin tuyển dụng, tỷ lệ chặn điều khoản vi phạm Bộ luật Lao
            động 2019 và luồng ứng viên IT.
          </p>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-2 bg-paper-white p-1 rounded-lg border border-warm-border shadow-sm">
          {(["7d", "30d", "90d", "1y"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                timeRange === r
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-charcoal-83 hover:text-charcoal-text hover:bg-surface-container"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon="verified"
          label="Tin Tuyển Dụng Đã Kiểm Định"
          value="486"
          change="+24.5%"
          positive={true}
        />
        <MetricCard
          icon="gavel"
          label="Vi Phạm Điều 98 Đã Chặn"
          value="73"
          change="-12.3%"
          positive={true}
        />
        <MetricCard
          icon="timer"
          label="Thời Gian Thẩm Định TB"
          value="1.4 giờ"
          change="-38%"
          positive={true}
        />
        <MetricCard
          icon="shield"
          label="Chỉ Số Hợp Chuẩn Pháp Lý"
          value="99.4%"
          change="+1.2%"
          positive={true}
          tone="dark"
        />
      </div>

      {/* Main Grid: Breakdown & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Breakdown Visuals */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Statutory Violation Distribution */}
          <div className="bg-paper-white rounded-xl border border-warm-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-lg text-charcoal-text">
                  Phân Bổ Điều Khoản Rủi Ro Được AI Phát Hiện
                </h3>
                <p className="text-xs text-charcoal-83 mt-0.5">
                  Các sai phạm phổ biến theo Bộ luật Lao động 2019 trong 30 ngày qua
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-surface-container text-charcoal-text rounded font-semibold border border-warm-border">
                73 Ca Rà Soát
              </span>
            </div>

            <div className="space-y-4">
              <StatBar
                label="Làm thêm giờ không cam kết hệ số 150% - 300% (Điều 98)"
                percentage={42}
                count="31 ca"
                color="bg-primary"
              />
              <StatBar
                label="Thử việc vượt trần 60 ngày đối với trình độ đại học (Điều 25)"
                percentage={28}
                count="20 ca"
                color="bg-amber-600"
              />
              <StatBar
                label="Điều khoản cấm làm việc phi lý sau thôi việc (Điều 35)"
                percentage={18}
                count="13 ca"
                color="bg-charcoal-83"
              />
              <StatBar
                label="Đóng BHXH dưới mức lương thỏa thuận thực tế (Điều 168)"
                percentage={12}
                count="9 ca"
                color="bg-red-500"
              />
            </div>

            <div className="mt-6 p-4 rounded-lg bg-parchment-bg border border-warm-border flex items-start gap-3 text-xs text-charcoal-83 leading-relaxed">
              <Icon name="info" className="text-primary !text-lg shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến nghị tự động:</strong> 100% tin tuyển dụng bị gắn cờ Điều 98 đã được
                bộ máy AI tự động tạo lại điều khoản mẫu chuẩn và chuyển về trạng thái hợp pháp
                trước khi đăng tải.
              </span>
            </div>
          </div>

          {/* Regional IT Market Distribution */}
          <div className="bg-paper-white rounded-xl border border-warm-border p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-charcoal-text mb-1">
              Phân Bổ Vị Trí Kỹ Thuật Theo Khu Vực
            </h3>
            <p className="text-xs text-charcoal-83 mb-6">
              Số lượng vai trò IT được kiểm định tại các trung tâm công nghệ
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-low rounded-xl border border-warm-border text-center">
                <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  TP. Hồ Chí Minh
                </span>
                <span className="text-2xl font-bold font-mono text-charcoal-text">262 JD</span>
                <span className="text-[11px] font-semibold text-green-700 block mt-1">
                  54% thị phần
                </span>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl border border-warm-border text-center">
                <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Hà Nội
                </span>
                <span className="text-2xl font-bold font-mono text-charcoal-text">155 JD</span>
                <span className="text-[11px] font-semibold text-green-700 block mt-1">
                  32% thị phần
                </span>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl border border-warm-border text-center">
                <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Đà Nẵng & Từ xa
                </span>
                <span className="text-2xl font-bold font-mono text-charcoal-text">69 JD</span>
                <span className="text-[11px] font-semibold text-green-700 block mt-1">
                  14% thị phần
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Feed */}
        <div className="lg:col-span-5">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-warm-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-charcoal-text">
                  Nhật Ký Thẩm Định Thời Gian Thực
                </h3>
                <p className="text-xs text-charcoal-83 mt-0.5">
                  Tiến trình rà soát trực tiếp từ AI Engine
                </p>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600 border border-white" />
              </span>
            </div>

            <div className="flex-1 divide-y divide-warm-border overflow-y-auto">
              {[
                {
                  company: "Vellum Studio",
                  role: "Kỹ sư Go / Kubernetes Cấp cao",
                  status: "PASSED",
                  statusText: "Đạt chuẩn 100%",
                  time: "12 phút trước",
                  tag: "Điều 98 & Điều 25",
                },
                {
                  company: "Aura Systems",
                  role: "Kỹ sư Di động React Native",
                  status: "FIXED",
                  statusText: "Đã sửa điều khoản thử việc",
                  time: "48 phút trước",
                  tag: "Sửa trần 60 ngày",
                },
                {
                  company: "Kestrel Analytics",
                  role: "Kiến trúc sư Giải pháp AI / Python",
                  status: "PASSED",
                  statusText: "Đạt chuẩn 100%",
                  time: "2 giờ trước",
                  tag: "Tuân thủ bản quyền AI",
                },
                {
                  company: "VNG Corporation",
                  role: "Kỹ sư Frontend Trưởng Cấp cao",
                  status: "PASSED",
                  statusText: "Đạt chuẩn 100%",
                  time: "4 giờ trước",
                  tag: "Minh bạch ESOP",
                },
                {
                  company: "MoMo (M_Service)",
                  role: "Kiến trúc sư Hạ tầng & DevOps",
                  status: "FIXED",
                  statusText: "Đã bổ sung phụ cấp trực đêm",
                  time: "6 giờ trước",
                  tag: "Phụ cấp trực ca đêm",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-charcoal-text">{item.role}</h4>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        item.status === "PASSED"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-83">{item.company}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-warm-border/60 text-[11px] text-charcoal-40 font-mono">
                    <span>{item.tag}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-warm-border bg-surface-container-low/50 flex justify-between items-center">
              <Link
                to="/admin/compliance"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Xem hàng đợi vi phạm</span>
                <Icon name="arrow_forward" className="!text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
