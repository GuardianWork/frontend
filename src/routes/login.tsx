import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AccountPurposeChoice } from "@/components/auth/AccountPurposeChoice";
import { PasswordInput, authInputClass } from "@/components/auth/PasswordInput";
import {
  getLoginDestination,
  loginAccount,
  loadCurrentUser,
  parseAccountPurpose,
  saveAuthSession,
} from "@/services/auth";

export const Route = createFileRoute("/login")({
  validateSearch: parseAccountPurpose,
  head: () => ({
    meta: [
      { title: "Đăng nhập — GuardianWork" },
      {
        name: "description",
        content: "Đăng nhập GuardianWork để tìm việc, quản lý hồ sơ hoặc tuyển dụng nhân tài.",
      },
    ],
  }),
  component: LoginPage,
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
      await navigate({ to: next || getLoginDestination(user, role) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login" purpose={role} next={next}>
      <h2 className="text-2xl font-bold tracking-tight">Đăng nhập GuardianWork</h2>
      <p className="mb-7 mt-2 text-sm leading-6 text-charcoal-83">
        {next
          ? "Đăng nhập bằng email nhận lời mời để tiếp tục. Bạn có thể dùng tên đăng nhập của tài khoản đó."
          : "Tiếp tục hành trình của bạn cùng những cơ hội mới."}
      </p>
      {!next && (
        <AccountPurposeChoice
          value={role}
          disabled={loading || !ready}
          onChange={(next) => {
            setError("");
            void navigate({ search: { role: next }, replace: true });
          }}
        />
      )}
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
      <p className="mt-6 text-center text-sm text-charcoal-83">
        Bạn chưa có tài khoản?{" "}
        <Link
          to="/register"
          search={{ role, next }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  );
}
