import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AccountPurpose } from "@/services/auth";

export function AuthLayout({
  mode,
  purpose,
  children,
}: {
  mode: "login" | "register";
  purpose: AccountPurpose;
  children: ReactNode;
}) {
  const registering = mode === "register";
  return (
    <div className="min-h-screen bg-parchment-bg font-sans text-charcoal-text">
      <header className="border-b border-warm-border bg-paper-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link to="/vn" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <ShieldCheck size={29} />
            <span>GuardianWork</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-charcoal-83 sm:inline">
              {registering ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
            </span>
            <Link
              to={registering ? "/login" : "/register"}
              search={{ role: purpose }}
              className="rounded-lg border border-warm-border px-4 py-2 font-semibold transition-colors hover:bg-surface-container"
            >
              {registering ? "Đăng nhập" : "Đăng ký"}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:py-16">
        <section className="lg:sticky lg:top-10">
          <Link
            to="/vn"
            className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-charcoal-83 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Về trang chủ
          </Link>
          <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[46px]">
            {purpose === "recruiter" ? (
              <>
                Đội ngũ vững mạnh.
                <br />
                <span className="text-charcoal-40">Bắt đầu từ bạn.</span>
              </>
            ) : (
              <>
                Bước tiếp theo.
                <br />
                <span className="text-charcoal-40">Sự nghiệp của bạn.</span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-charcoal-83">
            {purpose === "recruiter"
              ? "Xây dựng hồ sơ doanh nghiệp, đăng tin tuyển dụng và kết nối với những ứng viên phù hợp trên GuardianWork."
              : "Khám phá công việc phù hợp, xây dựng hồ sơ nổi bật và chủ động kết nối với nhà tuyển dụng trên GuardianWork."}
          </p>
          <div className="mt-8 hidden space-y-4 lg:block">
            {(purpose === "recruiter"
              ? [
                  "Quản lý tin tuyển dụng trong một không gian",
                  "Theo dõi ứng viên và tiến độ tuyển dụng",
                  "Xác thực thông tin, xây dựng uy tín công ty",
                ]
              : [
                  "Tìm công việc phù hợp với kỹ năng của bạn",
                  "Quản lý hồ sơ và các vị trí đã ứng tuyển",
                  "Kết nối với doanh nghiệp có thông tin rõ ràng",
                ]
            ).map((text) => (
              <p key={text} className="flex items-center gap-3 text-sm">
                <span className="rounded-full border border-warm-border bg-paper-white p-1">
                  <Check size={13} />
                </span>
                {text}
              </p>
            ))}
          </div>
          <div className="mt-10 hidden max-w-md rounded-2xl border border-warm-border bg-paper-white p-5 lg:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-surface-container p-3">
                  {purpose === "recruiter" ? <Users size={23} /> : <BriefcaseBusiness size={23} />}
                </div>
                <div>
                  <p className="text-sm font-semibold">Một nền tảng. Hai hành trình.</p>
                  <p className="mt-1 text-xs text-charcoal-83">
                    Cơ hội mới cho bạn và đội ngũ của bạn.
                  </p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-charcoal-40" />
            </div>
          </div>
        </section>
        <section
          aria-label={registering ? "Biểu mẫu đăng ký" : "Biểu mẫu đăng nhập"}
          className="rounded-2xl border border-warm-border bg-paper-white p-5 sm:p-8"
        >
          {children}
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pb-8 text-xs text-charcoal-40 sm:px-8">
        <span>© GuardianWork</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} />
          Kết nối sự nghiệp, xây dựng niềm tin.
        </span>
      </footer>
    </div>
  );
}
