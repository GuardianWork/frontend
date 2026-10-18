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
          <p className="mb-1 text-sm text-slate-500">Không gian tuyển dụng của bạn</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Chào mừng bạn trở lại <span className="text-emerald-600">!</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Kết nối đúng nhân tài. Xây dựng đội ngũ vững mạnh.
          </p>
        </div>
        <Link to="/recruiter/jobs" search={{ create: true }} className="recruiter-primary">
          <FilePlus2 size={17} />
          Đăng tin tuyển dụng
        </Link>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white p-2.5 text-emerald-600">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{statusText}</h3>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
              {status === "VERIFIED"
                ? "Thông tin doanh nghiệp đã được phê duyệt. Bạn có thể xem lại hồ sơ trong cài đặt tài khoản."
                : status === "PENDING"
                  ? "Hồ sơ đã được tiếp nhận. Theo dõi kết quả và yêu cầu bổ sung tại cài đặt tài khoản."
                  : "Cập nhật thông tin công ty và giấy đăng ký doanh nghiệp để xây dựng uy tín với ứng viên."}
            </p>
          </div>
        </div>
        <Link
          to="/recruiter/verification"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700"
        >
          {status === "PENDING" || status === "VERIFIED" ? "Xem hồ sơ" : "Xác thực ngay"}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Ứng viên trong danh sách",
            value: total,
            sub: "Tổng số hồ sơ",
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Ứng viên phù hợp cao",
            value: strong,
            sub: "Phù hợp với vị trí tuyển dụng",
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Đang phỏng vấn",
            value: interviews,
            sub: "Theo tiến độ tuyển dụng",
            color: "text-orange-500 bg-orange-50",
          },
          {
            label: "Đã gửi đề nghị",
            value: offers,
            sub: "Tiến gần hơn đến đội ngũ mới",
            color: "text-violet-600 bg-violet-50",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-5 text-slate-500">{item.label}</p>
              <Users size={30} className={`shrink-0 rounded-lg p-1.5 ${item.color}`} />
            </div>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-[11px] text-slate-400">{item.sub}</p>
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
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300"
          >
            <Icon size={21} className="shrink-0 text-emerald-600" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
            <ArrowRight
              size={15}
              className="ml-auto shrink-0 text-slate-400 group-hover:text-emerald-600"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
