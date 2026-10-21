import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { OnboardingLayout, onboardingButton } from "@/components/onboarding/OnboardingLayout";
import { hasAuthSession, loadCurrentUser, type AuthUser } from "@/services/auth";
import { ApiError } from "@/services/api";
import {
  clearEmailProof,
  continuePrivateLink,
  hasPrivateEmailLink,
  loadPersonalProof,
  markInvitedOnboarding,
  onboardingError,
  sendMemberEmail,
  verifyMemberEmail,
  type PersonalProof,
} from "@/services/recruiterOnboarding";

export const Route = createFileRoute("/employer-onboarding")({
  head: () => ({
    meta: [
      { title: "Xác thực nhà tuyển dụng — GuardianWork" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PersonalVerificationPage,
});
function PersonalVerificationPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [proof, setProof] = useState<PersonalProof | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signIn, setSignIn] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailLink, setEmailLink] = useState(false);
  const complete = Boolean(
    proof?.emailVerified &&
    proof.phoneVerified &&
    proof.stage === "VERIFIED" &&
    user?.activeMembership?.companyRole === "RECRUITER",
  );
  useEffect(() => {
    setReady(true);
    const update = () => setEmailLink(hasPrivateEmailLink());
    update();
    setSignIn(!hasAuthSession());
    window.addEventListener("guardianwork-private-link", update);
    return () => window.removeEventListener("guardianwork-private-link", update);
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);
  async function refresh() {
    const current = await loadCurrentUser();
    setUser(current);
    setSignIn(false);
    if (current.activeMembership?.companyRole !== "RECRUITER") {
      setProof(null);
      throw new Error("no-recruiter");
    }
    markInvitedOnboarding(current.id);
    const state = await loadPersonalProof();
    setProof(state);
    return state;
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "no-recruiter"
          ? "Bạn cần chấp nhận lời mời hợp lệ để tiếp tục với vai trò nhà tuyển dụng."
          : onboardingError(cause),
      );
      if (cause instanceof ApiError && cause.status === 401) setSignIn(true);
    } finally {
      setBusy(false);
    }
  }
  async function confirmEmail() {
    const secret = continuePrivateLink("email");
    if (!secret) {
      setError("Không tìm thấy liên kết xác thực. Hãy mở lại email xác nhận.");
      return;
    }
    if (!hasAuthSession()) {
      setSignIn(true);
      return;
    }
    const state = await refresh();
    if (!state.emailVerified) await verifyMemberEmail(secret);
    clearEmailProof();
    setCooldown(0);
    setEmailLink(false);
    await refresh();
    setNotice("Email đã được xác thực. Bạn có thể tải lại trạng thái tài khoản.");
  }
  return (
    <OnboardingLayout
      title={complete ? "Bạn đã sẵn sàng tham gia đội ngũ" : "Xác thực tài khoản tuyển dụng"}
      description={
        complete
          ? `Tài khoản của bạn đã hoàn tất xác thực cá nhân tại ${user?.activeMembership?.companyName}.`
          : "Xác thực email của bạn và theo dõi trạng thái tài khoản. Hồ sơ pháp lý của công ty do chủ sở hữu phụ trách."
      }
      step={complete ? 2 : proof ? 1 : undefined}
    >
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-lg bg-surface-container-low p-4 text-sm leading-6">
          {notice}
        </p>
      )}
      {emailLink && (
        <div className="mb-6 border-b border-warm-border pb-6">
          <h2 className="text-base font-semibold">Xác nhận email của bạn</h2>
          <p className="my-3 text-sm leading-6 text-charcoal-83">
            Đăng nhập đúng tài khoản nhận email, sau đó xác nhận liên kết này.
          </p>
          <button
            type="button"
            disabled={busy || !ready}
            className={onboardingButton}
            onClick={() => void run(confirmEmail)}
          >
            {busy ? "Đang xác nhận…" : "Xác nhận email"}
          </button>
        </div>
      )}
      {signIn ? (
        <>
          <p className="mb-5 text-sm leading-6">
            Đăng nhập để tiếp tục xác thực. Nếu vừa mở liên kết email, chọn “Xác nhận email” trước
            để giữ liên kết qua bước đăng nhập.
          </p>
          <Link
            to="/login"
            search={{ role: "recruiter", next: "/employer-onboarding" }}
            onClick={() => continuePrivateLink("email")}
            className={onboardingButton}
          >
            Đăng nhập
          </Link>
        </>
      ) : !proof ? (
        <>
          <h2 className="text-lg font-semibold">Bảo vệ tài khoản của bạn</h2>
          <p className="my-4 text-sm leading-7 text-charcoal-83">
            Tiếp tục sẽ đăng ký tài khoản thành viên vào quy trình xác thực cá nhân. Quyền tuyển
            dụng sẽ yêu cầu hoàn tất các bước này.
          </p>
          <button
            type="button"
            disabled={busy || !ready}
            className={onboardingButton}
            onClick={() =>
              void run(async () => {
                await refresh();
              })
            }
          >
            {busy ? "Đang tải…" : "Tiếp tục xác thực"}
          </button>
        </>
      ) : complete ? (
        <>
          <CheckCircle2 size={36} className="mb-4 text-primary" aria-hidden="true" />
          <p className="mb-6 text-sm leading-7 text-charcoal-83">
            Bạn có thể vào không gian tuyển dụng với vai trò Nhà tuyển dụng.
          </p>
          <Link to="/recruiter" className={onboardingButton}>
            Vào không gian tuyển dụng
          </Link>
        </>
      ) : (
        <>
          <div className="mb-6 border-b border-warm-border pb-5">
            <p className="break-words text-base font-semibold">
              {user?.activeMembership?.companyName}
            </p>
            <p className="mt-2 break-words text-sm text-charcoal-83">{user?.email}</p>
          </div>
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <Mail size={22} aria-hidden="true" />
            {proof.emailVerified ? "Trạng thái tài khoản" : "Xác thực email"}
          </h2>
          {!proof.emailVerified ? (
            <>
              <p className="my-4 text-sm leading-7 text-charcoal-83">
                Gửi liên kết đến email tài khoản của bạn. Mở email và chọn xác nhận; liên kết có
                hiệu lực 24 giờ. Lời mời tham gia công ty không thay thế bước xác thực email này.
              </p>
              <button
                type="button"
                disabled={busy || !ready || cooldown > 0}
                className={onboardingButton}
                onClick={() =>
                  void run(async () => {
                    try {
                      await sendMemberEmail();
                      setNotice(
                        "Dịch vụ đã tiếp nhận email xác thực. Hãy kiểm tra hộp thư và thư rác.",
                      );
                    } finally {
                      setCooldown(60);
                    }
                  })
                }
              >
                {cooldown ? `Gửi lại sau ${cooldown}s` : busy ? "Đang gửi…" : "Gửi email xác thực"}
              </button>
            </>
          ) : !proof.phoneVerified ? (
            <p className="mt-4 text-sm leading-7 text-charcoal-83">
              Email đã được xác thực. Tài khoản đang chờ hoàn tất xác thực số điện thoại trước khi
              có thể vào không gian tuyển dụng. Bạn có thể tải lại trạng thái sau khi hoàn tất bước
              này.
            </p>
          ) : (
            <p className="mt-4 text-sm leading-7 text-charcoal-83">
              Xác thực cá nhân đã hoàn tất nhưng công ty hiện chưa đủ điều kiện tuyển dụng. Liên hệ
              chủ sở hữu công ty và tải lại trạng thái sau.
            </p>
          )}
          <button
            type="button"
            disabled={busy || !ready}
            className="mt-6 block min-h-11 text-sm font-semibold text-primary underline underline-offset-4"
            onClick={() =>
              void run(async () => {
                await refresh();
              })
            }
          >
            Tải lại trạng thái
          </button>
        </>
      )}
      {error && (
        <Link
          to="/login"
          search={{ role: "recruiter", next: "/employer-onboarding" }}
          className="mt-5 block min-h-11 text-sm font-semibold text-primary underline underline-offset-4"
        >
          Đăng nhập lại
        </Link>
      )}
    </OnboardingLayout>
  );
}
