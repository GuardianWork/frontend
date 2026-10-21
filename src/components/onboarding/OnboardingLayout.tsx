import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const onboardingButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-charcoal-83 disabled:cursor-wait disabled:opacity-60";
export const onboardingSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-warm-border px-4 py-3 text-sm font-semibold hover:bg-surface-container-low disabled:opacity-60";
export function OnboardingLayout({
  title,
  description,
  children,
  step,
}: {
  title: string;
  description: string;
  children: ReactNode;
  step?: number;
}) {
  return (
    <div className="min-h-dvh bg-parchment-bg text-charcoal-text">
      <header className="border-b border-warm-border bg-paper-white">
        <div className="mx-auto flex min-h-[76px] max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/vn" className="flex items-center gap-2 text-lg font-bold text-primary">
            <ShieldCheck size={28} aria-hidden="true" />
            GuardianWork
          </Link>
          <span className="text-xs text-charcoal-83">Dành cho nhà tuyển dụng</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
        {step !== undefined && (
          <ol
            aria-label="Tiến trình tham gia công ty"
            className="mb-8 grid grid-cols-3 gap-3 text-xs sm:text-sm"
          >
            {["Lời mời", "Xác thực cá nhân", "Không gian tuyển dụng"].map((label, index) => (
              <li
                key={label}
                aria-current={index === step ? "step" : undefined}
                className={`border-t-2 pt-3 ${index <= step ? "border-primary font-semibold text-primary" : "border-warm-border text-charcoal-83"}`}
              >
                {label}
              </li>
            ))}
          </ol>
        )}
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-charcoal-83">{description}</p>
        <section className="mt-7 rounded-xl border border-warm-border bg-paper-white p-5 sm:p-7">
          {children}
        </section>
        <p className="mt-6 text-xs leading-6 text-charcoal-83">
          {step === 2
            ? "Quyền truy cập phụ thuộc vào tư cách thành viên hiện tại của bạn."
            : step === 1
              ? "Không chia sẻ mã hoặc liên kết xác thực với người khác."
              : "Chỉ xác nhận khi bạn nhận ra công ty và mong muốn tham gia đội ngũ của họ."}
        </p>
      </main>
    </div>
  );
}
