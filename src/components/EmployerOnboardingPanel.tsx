import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, Check, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useEmployerOnboarding } from "@/context/EmployerOnboardingContext";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getCurrentUser } from "@/services/auth";
import { ApiError } from "@/services/api";
import {
  employerError,
  sendEmployerEmail,
  verifyEmployerEmail,
} from "@/services/employerOnboarding";
import { clearMemberEmailSecret, getMemberEmailSecret } from "@/lib/member-email-secret";

const resendDeadlines = new Map<number, number>();

const copy = {
  EMAIL_REQUIRED: [
    "Xác thực email của bạn",
    "Xác thực email trước khi đăng ký công ty, nhận lời mời hoặc sử dụng chức năng tuyển dụng.",
  ],
  COMPANY_ACTION_REQUIRED: [
    "Kết nối với công ty của bạn",
    "Đăng ký hồ sơ công ty hoặc xem lời mời tham gia công ty. Thông tin khi tạo tài khoản chưa tạo công ty hay cấp quyền thành viên.",
  ],
  PENDING: [
    "Hồ sơ công ty đang chờ duyệt",
    "Bạn đã gửi hồ sơ. Chức năng tuyển dụng sẽ mở khi công ty được xác minh, theo quyền thành viên của bạn.",
  ],
  REJECTED: [
    "Hồ sơ công ty cần bổ sung",
    "Chủ sở hữu có thể xem lý do, sửa thông tin và gửi lại hồ sơ để được xét duyệt.",
  ],
  VERIFIED: [
    "Công ty đã được xác minh",
    "Bạn có thể sử dụng chức năng theo quyền thành viên hiện có.",
  ],
};
export function EmployerOnboardingPanel() {
  const context = useEmployerOnboarding();
  const navigate = useNavigate();
  const user = useAuthUser();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [until, setUntil] = useState(() => resendDeadlines.get(getCurrentUser()?.id ?? 0) ?? 0);
  function cooldown() {
    const deadline = Date.now() + 60000;
    resendDeadlines.set(getCurrentUser()?.id ?? 0, deadline);
    setUntil(deadline);
  }
  const [remaining, setRemaining] = useState(0);
  const [secret, setSecret] = useState(getMemberEmailSecret);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [until]);
  if (!context) return null;
  const { stage } = context.onboarding;
  const [title, description] = copy[stage];
  async function act(kind: "send" | "verify" | "refresh") {
    if (lock.current || !context) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (kind === "send") {
        const result = await sendEmployerEmail();
        cooldown();
        clearMemberEmailSecret();
        setSecret(null);
        setNotice(
          result.deliveryAccepted
            ? "Yêu cầu gửi email đã được tiếp nhận. Kiểm tra hộp thư và thư rác; chỉ dùng liên kết mới nhất."
            : "Email chưa được tiếp nhận để gửi. Tài khoản vẫn tồn tại; hãy chờ 60 giây rồi gửi lại, không cần đăng ký lại.",
        );
      } else if (kind === "verify" && secret) {
        await verifyEmployerEmail(secret);
        clearMemberEmailSecret();
        setSecret(null);
        setConfirmed(true);
        await context.refresh();
        setNotice("Email đã được xác thực. Quyền công ty được giữ theo vai trò hiện có.");
        await navigate({ to: "/recruiter", replace: true });
      } else await context.refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 429) cooldown();
      if (kind === "verify" && cause instanceof ApiError && cause.status === 400) {
        clearMemberEmailSecret();
        setSecret(null);
      }
      setError(employerError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby="onboarding-title"
      aria-busy={busy}
      className="mx-auto max-w-4xl rounded-xl border border-warm-border bg-paper-white p-5 sm:p-8"
    >
      <ol
        aria-label="Tiến trình thiết lập tuyển dụng"
        className="mb-8 flex flex-wrap gap-x-6 gap-y-3 border-b border-warm-border pb-5 text-sm"
      >
        {["Tài khoản", "Email", "Công ty"].map((label, index) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${index === 1 && stage === "EMAIL_REQUIRED" ? "font-semibold text-primary" : "text-charcoal-83"}`}
          >
            {index === 0 || (index === 1 && stage !== "EMAIL_REQUIRED") ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{index + 1}.</span>
            )}
            {label}
          </li>
        ))}
      </ol>
      {stage === "EMAIL_REQUIRED" ? (
        <Mail size={32} className="mb-4 text-primary" aria-hidden="true" />
      ) : (
        <ShieldCheck size={32} className="mb-4 text-primary" aria-hidden="true" />
      )}
      <h1 id="onboarding-title" className="text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-charcoal-83">{description}</p>
      {stage === "EMAIL_REQUIRED" && (
        <>
          <p className="mt-4 break-words text-base font-semibold">{user?.email}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal-83">
            Liên kết dùng một lần, có hiệu lực 24 giờ. Gửi lại email sẽ vô hiệu hóa liên kết trước.
          </p>
        </>
      )}
      {secret && (
        <div className="mt-5 rounded-lg bg-surface-container-low p-4">
          <p className="text-sm leading-6">
            Bạn đã mở liên kết xác thực. Chỉ tiếp tục nếu email nhận liên kết là{" "}
            <strong className="break-words">{user?.email}</strong>. Nếu khác, hãy đăng xuất và đăng
            nhập đúng tài khoản.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("verify")}
            className="recruiter-primary mt-4 min-h-11 disabled:opacity-60"
          >
            {busy ? "Đang xử lý…" : "Xác thực email cho tài khoản này"}
          </button>
        </div>
      )}
      {confirmed && stage === "EMAIL_REQUIRED" && (
        <p role="status" className="mt-4 text-sm">
          Email đã xác thực. Tải lại trạng thái để tiếp tục.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 text-sm leading-6 text-charcoal-83">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {stage === "EMAIL_REQUIRED" && !confirmed && (
          <button
            type="button"
            disabled={busy || remaining > 0}
            onClick={() => void act("send")}
            className="recruiter-primary min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {remaining > 0
              ? `Gửi lại sau ${remaining}s`
              : busy
                ? "Đang xử lý…"
                : "Gửi lại email xác thực"}
          </button>
        )}
        {(stage === "COMPANY_ACTION_REQUIRED" ||
          (stage === "REJECTED" && user?.activeMembership?.companyRole === "OWNER")) && (
          <Link
            to="/recruiter/verification"
            className="recruiter-primary inline-flex min-h-11 items-center gap-2"
          >
            <Building2 size={17} aria-hidden="true" />
            {stage === "REJECTED" ? "Xem và bổ sung hồ sơ" : "Chuẩn bị hồ sơ công ty"}
          </Link>
        )}
        {stage === "COMPANY_ACTION_REQUIRED" && (
          <Link
            to="/recruiter/members"
            className="inline-flex min-h-11 items-center rounded-lg border border-warm-border px-4 text-sm font-semibold text-primary"
          >
            Xem lời mời công ty
          </Link>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("refresh")}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary disabled:opacity-60"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {busy ? "Đang xử lý…" : "Tải lại trạng thái"}
        </button>
      </div>
    </section>
  );
}
