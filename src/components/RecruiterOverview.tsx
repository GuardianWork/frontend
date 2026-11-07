import { ArrowRightIcon, JobPostingsIcon } from "@/components/icons";

import { useAuthUser } from "@/hooks/useAuthUser";
import { Link } from "@tanstack/react-router";
import { GuardianIllustration } from "./GuardianIllustration";

export function RecruiterOverview() {
  const user = useAuthUser();
  const invitedRecruiter = user?.activeMembership?.companyRole === "RECRUITER";
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
