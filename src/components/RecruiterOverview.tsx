import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FilePlus2, Search, ShieldCheck, Users } from "lucide-react";
import {
  getStoredVerificationRecord,
  type CompanyVerificationRecord,
} from "@/services/companyVerification";

export function RecruiterOverview({
  total,
  strong,
  interviews,
  offers,
}: {
  total: number;
  strong: number;
  interviews: number;
  offers: number;
}) {
  const [company, setCompany] = useState<CompanyVerificationRecord | null>(null);
  useEffect(() => {
    setCompany(getStoredVerificationRecord());
  }, []);
  const status = company?.verificationStatus;
  const statusText =
    status === "VERIFIED"
      ? "Doanh nghiệp đã được xác thực"
      : status === "PENDING"
        ? "Hồ sơ công ty đang được xét duyệt"
        : status === "REJECTED"
          ? "Hồ sơ công ty cần bổ sung"
          : "Hoàn thiện xác thực doanh nghiệp";
  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-charcoal-83">Không gian tuyển dụng của bạn</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Chào mừng bạn trở lại <span className="text-primary">!</span>
          </h2>
          <p className="mt-2 text-sm text-charcoal-83">
            Kết nối đúng nhân tài. Xây dựng đội ngũ vững mạnh.
          </p>
        </div>
        <Link to="/recruiter/jobs" search={{ create: true }} className="recruiter-primary">
          <FilePlus2 size={17} />
          Đăng tin tuyển dụng
        </Link>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-warm-border bg-surface-container-low p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-paper-white p-2.5 text-primary">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-charcoal-text">{statusText}</h3>
            <p className="mt-1 max-w-xl text-xs leading-5 text-charcoal-83">
              {status === "VERIFIED"
                ? "Thông tin doanh nghiệp đã được phê duyệt. Bạn có thể xem lại hồ sơ trong cài đặt tài khoản."
                : status === "PENDING"
                  ? "Hồ sơ đã được tiếp nhận. Theo dõi kết quả và yêu cầu bổ sung tại cài đặt tài khoản."
                  : "Cập nhật thông tin công ty và giấy đăng ký doanh nghiệp để xây dựng uy tín với ứng viên."}
            </p>
          </div>
        </div>
        <Link
          to={status === "VERIFIED" ? "/recruiter/members" : "/recruiter/verification"}
          className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary"
        >
          {status === "VERIFIED"
            ? "Quản lý thành viên"
            : status === "PENDING"
              ? "Xem hồ sơ"
              : "Xác thực ngay"}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Ứng viên trong danh sách",
            value: total,
            sub: "Tổng số hồ sơ",
          },
          {
            label: "Ứng viên phù hợp cao",
            value: strong,
            sub: "Phù hợp với vị trí tuyển dụng",
          },
          {
            label: "Đang phỏng vấn",
            value: interviews,
            sub: "Theo tiến độ tuyển dụng",
          },
          {
            label: "Đã gửi đề nghị",
            value: offers,
            sub: "Tiến gần hơn đến đội ngũ mới",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-warm-border bg-paper-white p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-5 text-charcoal-83">{item.label}</p>
              <Users
                size={30}
                className="shrink-0 rounded-lg bg-surface-container p-1.5 text-primary"
              />
            </div>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-[11px] text-charcoal-40">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Đăng tin tuyển dụng",
            description: "Tạo tin đăng, tiếp cận ứng viên phù hợp.",
            to: "/recruiter/jobs",
            icon: FilePlus2,
          },
          {
            title: "Khám phá ứng viên",
            description: "Tìm kiếm nhân tài cho đội ngũ của bạn.",
            to: "/recruiter/talent",
            icon: Search,
          },
          {
            title: "Hồ sơ doanh nghiệp",
            description: "Quản lý thông tin và giấy tờ xác thực.",
            to: "/recruiter/verification",
            icon: Building2,
          },
        ].map(({ title, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3 rounded-xl border border-warm-border bg-paper-white p-4 transition-colors hover:border-primary/30"
          >
            <Icon size={21} className="shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-charcoal-83">{description}</p>
            </div>
            <ArrowRight
              size={15}
              className="ml-auto shrink-0 text-charcoal-40 group-hover:text-primary"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
