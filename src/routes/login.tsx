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
  validateSearch: (search: Record<string, unknown>): ReturnType<typeof parseAccountPurpose> =>
    IS_STAFF_PORTAL ? {} : parseAccountPurpose(search),
  head: () => ({
    meta: [
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
  const { role = "candidate", next } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
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
      if (next) await navigate({ href: next, replace: true });
      else await navigate({ to: getLoginDestination(user, role) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login" purpose={role}>
      <h2 className="text-2xl font-bold tracking-tight">Đăng nhập GuardianWork</h2>
      <p className="mb-7 mt-2 text-sm leading-6 text-charcoal-83">
        Tiếp tục hành trình của bạn cùng những cơ hội mới.
      </p>
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
