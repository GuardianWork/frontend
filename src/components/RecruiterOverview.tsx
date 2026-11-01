import {
  ArrowRightIcon,
  CompanyIcon,
  JobPostingsIcon,
  TalentSearchIcon,
  VerificationDossierIcon,
} from "@/components/icons";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Link } from "@tanstack/react-router";

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
  const user = useAuthUser();
  const invitedRecruiter = user?.activeMembership?.companyRole === "RECRUITER";
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
      <div className="guardian-welcome">
        <div className="guardian-welcome__content">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tổng quan tuyển dụng</h1>
            <p className="mt-2 text-sm text-charcoal-83">
              Theo dõi hồ sơ công ty, tin tuyển dụng và danh sách ứng viên.
            </p>
          </div>
          <Link to="/rec/jobs" search={{ create: true }} className="recruiter-primary">
            <JobPostingsIcon size={17} />
            Đăng tin tuyển dụng
          </Link>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-warm-border bg-surface-container-low p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <VerificationDossierIcon size={20} className="shrink-0 text-ink-2" />
          <div>
            <h3 className="text-sm font-semibold text-charcoal-text">
              {invitedRecruiter ? user?.activeMembership?.companyName : statusText}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-5 text-charcoal-83">
              {invitedRecruiter
                ? "Bạn đang tham gia công ty với vai trò Nhà tuyển dụng. Hồ sơ pháp lý do chủ sở hữu phụ trách."
                : status === "VERIFIED"
                  ? "Thông tin doanh nghiệp đã được phê duyệt. Bạn có thể xem lại hồ sơ trong cài đặt tài khoản."
                  : status === "PENDING"
                    ? "Hồ sơ đã được tiếp nhận. Theo dõi kết quả và yêu cầu bổ sung tại cài đặt tài khoản."
                    : "Cập nhật thông tin công ty và giấy đăng ký doanh nghiệp để xây dựng uy tín với ứng viên."}
            </p>
          </div>
        </div>
        {!invitedRecruiter && (
          <Link
            to={status === "VERIFIED" ? "/rec/members" : "/rec/verification"}
            className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary"
          >
            {status === "VERIFIED"
              ? "Quản lý thành viên"
              : status === "PENDING"
                ? "Xem hồ sơ"
                : "Xác thực ngay"}
            <ArrowRightIcon size={16} />
          </Link>
        )}
      </div>
      <p className="workspace-inline-note">
        Các chỉ số ứng viên dưới đây được tính từ danh sách minh họa, không phải số liệu tuyển dụng
        thực tế.
      </p>
      <div className="workspace-summary">
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
          <div key={item.label} className="workspace-summary__item">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-5 text-charcoal-83">{item.label}</p>
            </div>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs text-charcoal-40">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="workspace-shortcuts">
        {[
          {
            title: "Đăng tin tuyển dụng",
            description: "Tạo tin đăng, tiếp cận ứng viên phù hợp.",
            to: "/rec/jobs",
            icon: JobPostingsIcon,
          },
          {
            title: "Khám phá ứng viên",
            description: "Tìm kiếm nhân tài cho đội ngũ của bạn.",
            to: "/rec/talent",
            icon: TalentSearchIcon,
          },
          {
            title: "Hồ sơ doanh nghiệp",
            description: "Quản lý thông tin và giấy tờ xác thực.",
            to: "/rec/verification",
            icon: CompanyIcon,
          },
        ]
          .filter((item) => !invitedRecruiter || item.to !== "/rec/verification")
          .map(({ title, description, to, icon: Icon }) => (
            <Link key={to} to={to} className="workspace-shortcut group">
              <Icon size={21} className="shrink-0 text-primary" />
              <div>
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-charcoal-83">{description}</p>
              </div>
              <ArrowRightIcon
                size={15}
                className="ml-auto shrink-0 text-charcoal-40 group-hover:text-primary"
              />
            </Link>
          ))}
      </div>
    </div>
  );
}
