import { ArrowRightIcon, JobPostingsIcon, VerificationDossierIcon } from "@/components/icons";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Link } from "@tanstack/react-router";
import { GuardianIllustration } from "./GuardianIllustration";

import {
  getStoredVerificationRecord,
  type CompanyVerificationRecord,
} from "@/services/companyVerification";

export function RecruiterOverview() {
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
              Quản lý tin tuyển dụng, xử lý đơn ứng tuyển và theo dõi hồ sơ công ty.
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
            <h2 className="text-sm font-semibold text-charcoal-text">
              {invitedRecruiter ? user?.activeMembership?.companyName : statusText}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-charcoal-83">
              {invitedRecruiter
                ? "Bạn đang tham gia công ty với vai trò Nhà tuyển dụng. Hồ sơ pháp lý do chủ sở hữu phụ trách."
                : status === "VERIFIED"
                  ? "Thông tin doanh nghiệp đã được phê duyệt. Bạn có thể xem lại thông tin tại Hồ sơ công ty."
                  : status === "PENDING"
                    ? "Hồ sơ đã được tiếp nhận. Theo dõi kết quả và yêu cầu bổ sung tại Hồ sơ công ty."
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
      <section aria-labelledby="recruiter-work-heading">
        <h2 id="recruiter-work-heading" className="mb-4 text-lg font-semibold">
          Công việc tuyển dụng
        </h2>
        <div className="workspace-shortcuts">
          {[
            {
              title: "Tin tuyển dụng",
              description: "Soạn nội dung, gửi duyệt và theo dõi trạng thái tin đăng.",
              to: "/rec/jobs",
              art: "posting" as const,
            },
            {
              title: "Đơn ứng tuyển",
              description: "Xem hồ sơ, cập nhật trạng thái và theo dõi lịch sử xử lý.",
              to: "/rec/applications",
              art: "teamwork" as const,
            },
            {
              title: "Hồ sơ công ty",
              description: "Quản lý thông tin và giấy tờ xác thực.",
              to: "/rec/verification",
              art: "review" as const,
            },
          ]
            .filter((item) => !invitedRecruiter || item.to !== "/rec/verification")
            .map(({ title, description, to, art }) => (
              <Link key={to} to={to} className="workspace-shortcut group">
                <GuardianIllustration name={art} />
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
      </section>
    </div>
  );
}
