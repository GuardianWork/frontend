import { hasPendingInvitation } from "@/services/invitationLink";
import {
  clearMemberEmailSecret,
  getMemberEmailSecret,
  getInvitationSecret,
} from "@/lib/member-email-secret";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { IS_STAFF_PORTAL, staffPortalHref } from "@/lib/portal";
import { StaffLoginPage } from "@/components/auth/StaffLoginPage";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AccountPurposeChoice } from "@/components/auth/AccountPurposeChoice";
import { PasswordInput, authInputClass } from "@/components/auth/PasswordInput";
import {
  getLoginDestination,
  isStaffUser,
  loginAccount,
  logoutAccount,
  loadCurrentUser,
  parseAccountPurpose,
  saveAuthSession,
} from "@/services/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) =>
    IS_STAFF_PORTAL
      ? {}
      : {
          ...parseAccountPurpose(search),
          ...([
            "password-changed",
            "deactivated",
            "deletion-pending",
            "reactivated",
            "deletion-cancelled",
          ].includes(String(search.notice))
            ? { notice: String(search.notice) }
            : {}),
        },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      {
        title: IS_STAFF_PORTAL
          ? "Đăng nhập Platform staff — GuardianWork"
          : "Đăng nhập — GuardianWork",
      },
      {
        name: "description",
        content: "Đăng nhập GuardianWork để tìm việc, quản lý hồ sơ hoặc tuyển dụng nhân tài.",
      },
    ],
  }),
  component: () => (IS_STAFF_PORTAL ? <StaffLoginPage /> : <LoginPage />),
});

function LoginPage() {
  const { role = "candidate", next, notice } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasEmailLink, setHasEmailLink] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    setHasEmailLink(Boolean(getMemberEmailSecret()));
  }, []);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!identifier.trim()) {
      setError("Vui lòng nhập email hoặc tên đăng nhập.");
      return;
    }
    setLoading(true);
    try {
      const session = await loginAccount(identifier, password);
      saveAuthSession(session);
      const user = await loadCurrentUser();
      if (isStaffUser(user)) {
        await logoutAccount();
        window.location.assign(staffPortalHref("/login"));
        return;
      }
      const legacySetupLink = getMemberEmailSecret();
      await navigate({
        to: legacySetupLink
          ? "/rec/verification"
          : getInvitationSecret()
            ? "/rec/members"
            : hasPendingInvitation()
              ? "/company-invitations"
              : getLoginDestination(user, role),
      });
      if (legacySetupLink) clearMemberEmailSecret();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login" purpose={role}>
      <h1 className="text-2xl font-bold tracking-tight">Đăng nhập GuardianWork</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-charcoal-83">
        Một tài khoản cho cả tìm việc và tuyển dụng. Chọn không gian bạn muốn tiếp tục.
      </p>
      {hasEmailLink && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-warm-border bg-surface-container-low p-4 text-sm leading-6"
        >
          Liên kết thiết lập tuyển dụng cũ không còn được dùng. Đăng nhập để tiếp tục với hồ sơ công
          ty.
        </p>
      )}
      {notice && (
        <p role="status" className="mb-5 rounded-lg bg-surface-container-low p-4 text-sm leading-6">
          {
            {
              "password-changed":
                "Đã đổi mật khẩu và kết thúc mọi phiên đăng nhập. Hãy đăng nhập lại bằng mật khẩu mới.",
              deactivated:
                "Tài khoản đã tạm ngừng và hồ sơ ứng viên đã được ẩn. Mọi phiên đăng nhập đã kết thúc.",
              "deletion-pending":
                "Yêu cầu xóa tài khoản đang chờ xử lý. Truy cập đã dừng; dữ liệu chưa được xóa vĩnh viễn và chưa có ngày hoàn tất được cam kết.",
              reactivated:
                "Tài khoản đã được kích hoạt lại. Hãy đăng nhập bình thường để tiếp tục.",
              "deletion-cancelled":
                "Đã hủy yêu cầu xóa đang chờ. Hãy đăng nhập bình thường để tiếp tục.",
            }[notice]
          }
        </p>
      )}
      <AccountPurposeChoice
        value={role}
        disabled={loading || !ready}
        onChange={(choice) => {
          setError("");
          void navigate({ search: (previous) => ({ ...previous, role: choice }), replace: true });
        }}
      />
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
          >
            {error}
          </p>
        )}
        <div>
          <label htmlFor="login-identifier" className="mb-2 block text-sm font-medium">
            Email hoặc tên đăng nhập <span aria-hidden="true">*</span>
          </label>
          <input
            id="login-identifier"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Email hoặc tên đăng nhập của bạn"
            disabled={loading || !ready}
            className={authInputClass}
          />
        </div>
        <PasswordInput
          id="login-password"
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={loading || !ready}
        />
        <button
          type="submit"
          disabled={loading || !ready}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" />
              Đang đăng nhập…
            </>
          ) : (
            <>
              Đăng nhập
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link
          to="/account-recovery"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Kích hoạt lại hoặc hủy yêu cầu xóa tài khoản
        </Link>
      </p>
      <p className="mt-6 text-center text-sm">
        <a
          href={staffPortalHref()}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Đăng nhập Platform staff
        </a>
      </p>
      <p className="mt-6 text-center text-sm text-charcoal-83">
        Bạn chưa có tài khoản?{" "}
        <Link
          to="/register"
          search={next ? { role, next } : { role }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}
