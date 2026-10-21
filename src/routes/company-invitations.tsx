import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ArrowRight } from "lucide-react";
import {
  OnboardingLayout,
  onboardingButton,
  onboardingSecondary,
} from "@/components/onboarding/OnboardingLayout";
import { hasAuthSession, loadCurrentUser } from "@/services/auth";
import { ApiError } from "@/services/api";
import {
  acceptInvitation,
  rememberAcceptance,
  hasAcceptanceIntent,
  clearInvitation,
  continuePrivateLink,
  declineInvitation,
  markInvitedOnboarding,
  onboardingError,
  previewInvitation,
  type InvitationPreview,
} from "@/services/recruiterOnboarding";

export const Route = createFileRoute("/company-invitations")({
  head: () => ({
    meta: [
      { title: "Lời mời tham gia công ty — GuardianWork" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: InvitationPage,
});
function InvitationPage() {
  const navigate = Route.useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signIn, setSignIn] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [historical, setHistorical] = useState(false);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const reset = () => {
      setPreview(null);
      setSecret("");
      setAccepted(false);
      setHistorical(false);
      setDeclined(false);
      setError("");
    };
    window.addEventListener("guardianwork-private-link", reset);
    return () => window.removeEventListener("guardianwork-private-link", reset);
  }, []);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(onboardingError(cause, "invitation"));
      if (cause instanceof ApiError && cause.status === 401) setSignIn(true);
    } finally {
      setBusy(false);
    }
  }
  async function continueInvitation() {
    const token = continuePrivateLink("invitation");
    if (!token) {
      setError("Không tìm thấy liên kết lời mời. Hãy mở lại liên kết trong email của bạn.");
      return;
    }
    setSecret(token);
    if (!hasAuthSession()) {
      await navigate({ to: "/login", search: { role: "recruiter", next: "/company-invitations" } });
      return;
    }
    const user = await loadCurrentUser();
    if (hasAcceptanceIntent(user.id, token)) {
      await accept(token);
      return;
    }
    setPreview(await previewInvitation(token));
  }
  async function accept(token = secret) {
    // Retain the secret if either acceptance or /me has an uncertain response. Retrying is idempotent.
    const current = await loadCurrentUser();
    rememberAcceptance(current.id, token);
    const receipt = await acceptInvitation(token);
    if (receipt.membershipStatus !== "ACTIVE") {
      setHistorical(true);
      clearInvitation();
      return;
    }
    setAccepted(true);
    const user = await loadCurrentUser();
    if (
      !user.activeMembership ||
      user.activeMembership.companyId !== receipt.companyId ||
      user.activeMembership.companyRole !== "RECRUITER"
    )
      throw new ApiError("Current membership unavailable");
    markInvitedOnboarding(user.id);
    clearInvitation();
    await navigate({ to: "/employer-onboarding" });
  }
  return (
    <OnboardingLayout
      title={
        declined
          ? "Đã từ chối lời mời"
          : historical
            ? "Tư cách thành viên đã kết thúc"
            : "Tham gia đội ngũ tuyển dụng"
      }
      description={
        declined
          ? "Bạn chưa tham gia công ty qua lời mời này."
          : historical
            ? "Lời mời đã được xử lý trước đó. Tư cách thành viên đó hiện không còn hoạt động."
            : "Xem thông tin công ty và chủ động xác nhận trước khi trở thành thành viên."
      }
      step={preview ? 0 : undefined}
    >
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
      {declined || historical ? (
        <Link to="/vn" className={onboardingSecondary}>
          Về trang chủ
        </Link>
      ) : (
        <>
          {preview ? (
            <>
              <div className="flex items-start gap-4">
                <Building2 size={28} className="shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold">{preview.companyName}</h2>
                  <p className="mt-2 text-sm text-charcoal-83">Vai trò: Nhà tuyển dụng</p>
                  <p className="mt-2 text-sm text-charcoal-83">
                    Hết hạn:{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(new Date(preview.expiresAt))}{" "}
                    (giờ Việt Nam)
                  </p>
                </div>
              </div>
              <p className="my-6 border-t border-warm-border pt-5 text-sm leading-7 text-charcoal-83">
                Chấp nhận sẽ tạo tư cách thành viên tại công ty này. Quyền tuyển dụng phụ thuộc vào
                trạng thái xác thực tài khoản của bạn.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy || !ready}
                  onClick={() => void run(() => accept())}
                  className={onboardingButton}
                >
                  {busy
                    ? "Đang xử lý…"
                    : accepted
                      ? "Thử lại và tải quyền thành viên"
                      : "Chấp nhận lời mời"}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
                {!accepted && (
                  <button
                    type="button"
                    disabled={busy || !ready}
                    onClick={() =>
                      void run(async () => {
                        await declineInvitation(secret);
                        clearInvitation();
                        setDeclined(true);
                      })
                    }
                    className={onboardingSecondary}
                  >
                    Từ chối
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mb-6 text-sm leading-7 text-charcoal-83">
                Tiếp tục để đăng nhập bằng tài khoản có email nhận lời mời và xem thông tin công ty.
                Thao tác này chưa chấp nhận lời mời.
              </p>
              <button
                type="button"
                disabled={busy || !ready}
                onClick={() => void run(continueInvitation)}
                className={onboardingButton}
              >
                {busy ? "Đang tải…" : "Tiếp tục"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </>
          )}
          {(signIn || error) && (
            <Link
              to="/login"
              search={{ role: "recruiter", next: "/company-invitations" }}
              className="mt-5 block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Đăng nhập bằng tài khoản khác
            </Link>
          )}
        </>
      )}
    </OnboardingLayout>
  );
}
