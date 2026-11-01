import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthUser } from "@/hooks/useAuthUser";
import { loadCurrentUser } from "@/services/auth";
import { ApiError } from "@/services/api";
import { captureInvitationLink, clearInvitationLink } from "@/services/invitationLink";
import {
  previewCompanyInvitation,
  acceptCompanyInvitation,
  declineCompanyInvitation,
  type RecipientInvitationPreview,
} from "@/services/companyInvitations";
import { EmailVerificationPanel } from "@/components/auth/EmailVerification";

export const Route = createFileRoute("/company-invitations")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Lời mời tham gia công ty — GuardianWork" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: InvitationPage,
});
function InvitationPage() {
  const user = useAuthUser();
  const [secret, setSecret] = useState("");
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<RecipientInvitationPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    setSecret(captureInvitationLink());
    setReady(true);
  }, []);
  useEffect(() => {
    setPreview(null);
    setConfirmed(false);
  }, [user?.id]);
  async function inspect() {
    if (!secret || busy) return;
    setBusy(true);
    setError("");
    try {
      await loadCurrentUser();
      setPreview(await previewCompanyInvitation(secret));
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }
  function showError(cause: unknown) {
    setError(
      cause instanceof ApiError && cause.status === 404
        ? "Lời mời không khả dụng hoặc không dành cho tài khoản này. Kiểm tra email đăng nhập hoặc yêu cầu lời mời mới."
        : cause instanceof ApiError && cause.status === 403
          ? "Bạn chưa đủ điều kiện thực hiện thao tác này. Xác minh email và kiểm tra trạng thái tài khoản, công ty trước khi thử lại."
          : cause instanceof Error
            ? cause.message
            : "Không thể xử lý lời mời. Vui lòng thử lại.",
    );
  }
  async function decide(accept: boolean) {
    if (!preview || busy || (accept && !confirmed)) return;
    setBusy(true);
    setError("");
    try {
      if (accept) await acceptCompanyInvitation(secret);
      else await declineCompanyInvitation(secret);
      // Keep the receipt visible even if refreshing membership fails; retry never replays the decision.
      clearInvitationLink();
      setSecret("");
      setPreview(null);
      setAccepted(accept);
      setResult(accept ? "Đã tham gia công ty." : "Đã từ chối lời mời.");
      if (accept) await loadCurrentUser();
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <Link to="/vn" className="text-lg font-semibold text-primary">
        GuardianWork
      </Link>
      <h1 className="mb-3 mt-8 text-2xl font-bold">Lời mời tham gia công ty</h1>
      <p className="mb-6 text-sm leading-6 text-charcoal-83">
        Đăng nhập bằng email nhận lời mời, kiểm tra thông tin công ty rồi xác nhận tham gia với vai
        trò nhà tuyển dụng.
      </p>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          {error}
        </p>
      )}
      {result ? (
        <section>
          <p role="status" className="mb-4 text-lg font-semibold">
            {result}
          </p>
          <Link
            to={accepted ? "/rec" : "/can/jobs"}
            className="recruiter-primary inline-flex min-h-11 items-center"
          >
            {accepted ? "Vào không gian tuyển dụng" : "Tiếp tục tìm việc"}
          </Link>
        </section>
      ) : !ready ? (
        <p role="status">Đang đọc lời mời…</p>
      ) : !secret ? (
        <p role="status" className="text-sm leading-6">
          Không tìm thấy lời mời. Hãy mở lại liên kết trong email. Vì bảo mật, lời mời không được
          lưu khi tải lại trang.
        </p>
      ) : !user ? (
        <div className="space-y-4">
          <p className="text-sm leading-6">
            Lời mời chỉ được giữ trong trang này. Vui lòng giữ trang mở khi đăng nhập hoặc đăng ký.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              search={{ role: "recruiter" }}
              className="recruiter-primary inline-flex min-h-11 items-center"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              search={{ role: "recruiter" }}
              className="inline-flex min-h-11 items-center px-3 font-semibold text-primary"
            >
              Tạo tài khoản
            </Link>
          </div>
        </div>
      ) : (
        <section>
          <p className="mb-4 break-words text-sm">Tài khoản: {user.email}</p>
          {!user.recruitingEmailEligible && <EmailVerificationPanel />}
          <button
            disabled={busy}
            onClick={() => void inspect()}
            className="min-h-11 rounded-lg border border-warm-border px-4 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Đang xử lý…" : "Kiểm tra lời mời"}
          </button>
          {preview && (
            <div className="mt-6 space-y-4 border-t border-warm-border pt-5">
              <h2 className="break-words text-xl font-semibold">{preview.companyName}</h2>
              <p className="text-sm leading-6">
                Vai trò: Nhà tuyển dụng. Hết hạn:{" "}
                {new Date(preview.expiresAt).toLocaleString("vi-VN")}.
              </p>
              <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                Tôi xác nhận muốn tham gia công ty này.
              </label>
              {!user.recruitingEmailEligible && (
                <p id="invitation-email-required" className="text-sm leading-6 text-charcoal-83">
                  Bạn cần xác minh email để tham gia công ty. Nếu bạn vừa xác minh trong tab khác,
                  chọn “Cập nhật trạng thái xác minh” để cập nhật trạng thái.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  aria-describedby={
                    !user.recruitingEmailEligible ? "invitation-email-required" : undefined
                  }
                  disabled={busy || !confirmed}
                  onClick={() => void decide(true)}
                  className="recruiter-primary min-h-11 disabled:opacity-60"
                >
                  Chấp nhận lời mời
                </button>
                <button
                  disabled={busy}
                  onClick={() => void decide(false)}
                  className="min-h-11 rounded-lg border border-warm-border px-4 text-sm font-semibold disabled:opacity-60"
                >
                  Từ chối lời mời
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
