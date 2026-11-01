import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEmployerOnboarding } from "@/hooks/useEmployerOnboarding";
import { useAuthUser } from "@/hooks/useAuthUser";

const copy = {
  COMPANY_ACTION_REQUIRED: [
    "Kết nối với công ty của bạn",
    "Tạo hồ sơ công ty để bắt đầu tuyển dụng hoặc xem lời mời tham gia một công ty có sẵn.",
  ],
  PENDING: [
    "Hồ sơ công ty đang chờ duyệt",
    "Hồ sơ đã được gửi. Các chức năng tuyển dụng sẽ mở theo trạng thái xác minh và quyền thành viên.",
  ],
  REJECTED: [
    "Hồ sơ công ty cần bổ sung",
    "Chủ sở hữu có thể xem lý do, cập nhật thông tin và gửi lại hồ sơ để được xét duyệt.",
  ],
  VERIFIED: [
    "Công ty đã được xác minh",
    "Quyền truy cập tuyển dụng được cấp theo vai trò thành viên công ty của bạn.",
  ],
};

export function EmployerOnboardingPanel() {
  const context = useEmployerOnboarding();
  const user = useAuthUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!context) return null;
  const { stage } = context.onboarding;
  const [title, description] = copy[stage];

  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await context?.refresh();
    } catch {
      setError("Không thể tải trạng thái công ty. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="onboarding-title"
      aria-busy={busy}
      className="mx-auto max-w-4xl rounded-xl border border-warm-border bg-paper-white p-5 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3 text-primary" aria-hidden="true">
        {stage === "COMPANY_ACTION_REQUIRED" ? <Building2 size={28} /> : <ShieldCheck size={28} />}
        <span className="text-sm font-medium text-charcoal-83">{user?.email}</span>
      </div>
      <h1 id="onboarding-title" className="text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-charcoal-83">{description}</p>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {(stage === "COMPANY_ACTION_REQUIRED" || stage === "REJECTED") && (
          <Link
            to="/rec/verification"
            className="recruiter-primary inline-flex min-h-11 items-center gap-2"
          >
            <Building2 size={17} aria-hidden="true" />
            {stage === "REJECTED" ? "Xem và bổ sung hồ sơ" : "Thiết lập hồ sơ công ty"}
          </Link>
        )}
        {stage === "COMPANY_ACTION_REQUIRED" && (
          <Link
            to="/rec/members"
            className="inline-flex min-h-11 items-center rounded-lg border border-warm-border px-4 text-sm font-semibold text-primary"
          >
            Xem lời mời công ty
          </Link>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary disabled:opacity-60"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {busy ? "Đang tải…" : "Tải lại trạng thái"}
        </button>
      </div>
    </section>
  );
}
