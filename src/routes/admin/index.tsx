import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — GuardianWork Admin" },
      {
        name: "description",
        content:
          "Overview of the GuardianWork legal talent platform: seekers, firms, verifications, and live audit activity.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function KpiCard({
  icon,
  label,
  value,
  badge,
  badgeIcon,
  tone = "light",
}: {
  icon: string;
  label: string;
  value: string;
  badge: string;
  badgeIcon: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={
        dark
          ? "col-span-1 md:col-span-4 bg-primary text-on-primary rounded-2xl shadow-sm p-6 flex flex-col relative overflow-hidden hover:shadow-md transition-shadow"
          : "col-span-1 md:col-span-4 bg-paper-white rounded-2xl border border-warm-border shadow-sm p-6 flex flex-col relative overflow-hidden hover:shadow-md transition-shadow"
      }
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={
            dark
              ? "p-2.5 bg-white/10 rounded-xl inline-flex border border-white/10"
              : "p-2.5 bg-surface-container-low rounded-xl text-primary inline-flex"
          }
        >
          <Icon name={icon} />
        </div>
        <span
          className={
            dark
              ? "px-2 py-1 bg-white/10 rounded-md text-xs font-semibold flex items-center gap-1 text-white border border-white/10"
              : "px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1 border border-green-100"
          }
        >
          <Icon name={badgeIcon} className="!text-[14px]" /> {badge}
        </span>
      </div>
      <div className="mt-auto pt-4">
        <h3
          className={
            dark
              ? "text-sm font-medium mb-1 text-on-primary/80"
              : "text-sm font-medium mb-1 text-on-surface-variant"
          }
        >
          {label}
        </h3>
        <p
          className={
            dark
              ? "font-bold text-4xl text-white tracking-tight"
              : "font-bold text-4xl text-on-surface tracking-tight"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: "primary" | "secondary";
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2 font-medium text-on-surface border-b border-dashed border-warm-border pb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-4 w-full bg-surface-container-low rounded-sm overflow-hidden border border-warm-border">
        <div
          className={tone === "primary" ? "h-full bg-primary" : "h-full bg-secondary"}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const FEED = [
  {
    icon: "warning",
    tone: "error",
    title: "Phát hiện Rủi ro Điều 98",
    desc: "Tin tuyển dụng TechCorp thiếu điều khoản thanh toán tiền làm thêm giờ 150%.",
    time: "2 phút trước",
  },
  {
    icon: "verified_user",
    tone: "neutral",
    title: "Doanh nghiệp Mới Hoàn tất KYC",
    desc: "Vellum Studio đã xác thực pháp nhân và cam kết tuân thủ Luật Lao động 2019.",
    time: "15 phút trước",
  },
  {
    icon: "handshake",
    tone: "neutral",
    title: "Khớp Nối Thành Công",
    desc: "Kỹ sư Go / Kubernetes Cấp cao đã nhận Offer chính thức tại Aura Systems.",
    time: "1 giờ trước",
  },
  {
    icon: "smart_toy",
    tone: "neutral",
    title: "Cảnh báo AI Thị Trường",
    desc: "Mức lương đề xuất cho vị trí Cloud Architect tăng 18% tại khu vực TP.HCM.",
    time: "2 giờ trước",
  },
];

function AdminDashboardPage() {
  return (
    <AdminShell title="Platform Overview" role="admin">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="font-bold text-3xl md:text-4xl text-on-surface tracking-tight mb-2">
            Admin Console
          </h2>
          <p className="text-base text-on-surface-variant max-w-xl">
            Tổng quan quản trị nền tảng việc làm IT và kiểm toán tuân thủ Bộ luật Lao động 2019.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/compliance"
            className="px-3.5 py-1.5 bg-paper-white border border-warm-border rounded-lg text-xs font-semibold text-charcoal-text hover:bg-surface-container transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="verified_user" className="!text-sm text-primary" />
            <span>Hàng đợi Tuân thủ</span>
          </Link>
          <span className="px-3 py-1.5 bg-paper-white border border-warm-border rounded-full text-xs font-semibold text-on-surface flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Hệ thống Hoạt động Tốt
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <KpiCard
          icon="person_search"
          label="Tổng Số Ứng Viên IT"
          value="14,208"
          badge="+12%"
          badgeIcon="trending_up"
        />
        <KpiCard
          icon="corporate_fare"
          label="Doanh Nghiệp Đã Kiểm Định"
          value="1,842"
          badge="+5%"
          badgeIcon="trending_up"
        />
        <KpiCard
          icon="gavel"
          label="Kiểm Toán JD Pháp Lý (30d)"
          value="4,392"
          badge="High Volume"
          badgeIcon="local_fire_department"
          tone="dark"
        />

        {/* Market Pulse */}
        <section className="col-span-1 md:col-span-8 bg-paper-white rounded-2xl border border-warm-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-warm-border flex justify-between items-center">
            <h3 className="font-semibold text-lg text-on-surface flex items-center gap-2">
              <Icon name="monitoring" className="text-primary" />
              Tỷ Trọng Nhu Cầu Tuyển Dụng IT Hợp Chuẩn
            </h3>
            <span className="text-xs font-mono text-charcoal-40">Q1/2026</span>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-8">
            <div className="space-y-6">
              <Bar label="Backend & Cloud Infrastructure (Go, K8s)" value={38} />
              <Bar label="Frontend & Mobile Architecture (React, RN)" value={24} tone="secondary" />
              <Bar label="AI Solutions & Machine Learning (Python)" value={22} />
              <Bar label="DevOps & Security Compliance (SOC2, ISO)" value={16} tone="secondary" />
            </div>
            <div className="mt-auto p-5 bg-surface-container-low border border-warm-border rounded-xl flex items-start gap-3 shadow-inner">
              <Icon name="lightbulb" className="text-primary mt-0.5" />
              <p className="text-sm text-on-surface leading-relaxed">
                <span className="font-semibold text-primary mr-1 border-b border-primary/30">
                  Phân tích:
                </span>
                100% tin tuyển dụng kỹ thuật cao yêu cầu cam kết rõ ràng về Điều 98 làm thêm giờ và
                trần thử việc 60 ngày theo Điều 25.
              </p>
            </div>
          </div>
        </section>

        {/* Audit log */}
        <section className="col-span-1 md:col-span-4 bg-paper-white rounded-2xl border border-warm-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-warm-border flex justify-between items-center">
            <h3 className="font-semibold text-lg text-on-surface flex items-center gap-2">
              <Icon name="feed" className="text-primary" />
              Nhật Ký Kiểm Toán
            </h3>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border border-white" />
            </span>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-warm-border">
            {FEED.map((f) => (
              <div
                key={f.title}
                className="p-5 flex gap-4 hover:bg-surface-container-low transition-colors group"
              >
                <div
                  className={
                    f.tone === "error"
                      ? "w-8 h-8 rounded-full bg-error/10 text-error border border-error/20 flex items-center justify-center shrink-0 mt-1"
                      : "w-8 h-8 rounded-full bg-surface-container border border-warm-border text-primary flex items-center justify-center shrink-0 mt-1"
                  }
                >
                  <Icon name={f.icon} className="!text-sm" />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${f.tone === "error" ? "group-hover:text-error" : "group-hover:text-primary"} transition-colors text-on-surface`}
                  >
                    {f.title}
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-snug">{f.desc}</p>
                  <span className="text-xs text-on-surface-variant mt-2 block font-medium">
                    {f.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-warm-border text-center">
            <Link
              to="/admin/compliance"
              className="text-sm font-semibold text-primary hover:opacity-80 border-b border-primary pb-0.5"
            >
              Xem Toàn Bộ Hàng Đợi Kiểm Toán
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
