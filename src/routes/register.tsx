import { isLegacyRegistrationLink } from "@/lib/member-email-secret";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AccountPurposeChoice } from "@/components/auth/AccountPurposeChoice";
import { PasswordInput, authInputClass } from "@/components/auth/PasswordInput";
import { ApiError } from "@/services/api";
import { parseAccountPurpose, registerAccount } from "@/services/auth";

export const Route = createFileRoute("/register")({
  validateSearch: parseAccountPurpose,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Đăng ký tìm việc & tuyển dụng — GuardianWork" },
      {
        name: "description",
        content:
          "Tạo tài khoản GuardianWork để tìm việc hoặc tuyển dụng. Lựa chọn hành trình phù hợp với bạn.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { role = "candidate", next } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const [error, setError] = useState("");
  const [legacy, setLegacy] = useState(false);
  useEffect(() => setLegacy(isLegacyRegistrationLink()), []);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Vui lòng nhập đầy đủ họ và tên.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username.trim())) {
      setError("Tên đăng nhập cần 3–50 ký tự, chỉ gồm chữ không dấu, số hoặc dấu gạch dưới.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(password)) {
      setError("Mật khẩu cần 8–128 ký tự, có chữ hoa, chữ thường và số.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận chưa khớp.");
      document.getElementById("register-confirmation")?.focus();
      return;
    }
    setLoading(true);
    try {
      await registerAccount({ firstName, lastName, username, email, password });
      setPassword("");
      setConfirmation("");
      setRegistered(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 409
          ? "Email hoặc số điện thoại đã được sử dụng. Hãy đăng nhập nếu bạn đã có tài khoản."
          : cause instanceof Error
            ? cause.message
            : "Không thể đăng ký. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register" purpose={role}>
      {registered ? (
        <div role="status" className="py-8 text-center">
          <CheckCircle2 size={46} className="mx-auto mb-5" />
          <h1 className="text-2xl font-bold">Tạo tài khoản thành công!</h1>
          <p className="mt-3 text-sm leading-7 text-charcoal-83">
            Chào {firstName.trim()}, tài khoản của bạn đã được tạo.{" "}
            {role === "recruiter"
              ? "Đăng nhập với lựa chọn Nhà tuyển dụng để thiết lập hồ sơ công ty hoặc chấp nhận lời mời thành viên."
              : "Đăng nhập để tạo hồ sơ và khám phá những công việc phù hợp."}
          </p>
          <Link
            to="/login"
            search={next ? { role, next } : { role }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
          >
            Đến trang đăng nhập
            <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản của bạn</h1>
          <p className="mb-7 mt-2 text-sm leading-6 text-charcoal-83">
            Một tài khoản cho cả tìm việc và tuyển dụng. Lựa chọn bên dưới chỉ chọn không gian sau
            khi đăng nhập.
          </p>
          {legacy && (
            <p
              role="status"
              className="mb-5 rounded-lg border border-warm-border bg-surface-container-low p-4 text-sm leading-6"
            >
              Liên kết đăng ký cũ đã ngừng sử dụng. Hãy đăng ký mới bên dưới hoặc{" "}
              <Link
                to="/login"
                search={{ role: "recruiter" }}
                className="font-semibold text-primary underline"
              >
                đăng nhập nếu đã có tài khoản
              </Link>
              .
            </p>
          )}
          <AccountPurposeChoice
            value={role}
            disabled={loading || !ready}
            onChange={(choice) => {
              setError("");
              void navigate({
                search: (previous) => ({ ...previous, role: choice }),
                replace: true,
              });
            }}
          />
          {role === "recruiter" && (
            <p className="mb-5 rounded-lg border border-warm-border bg-surface-container-low p-3 text-sm leading-6 text-charcoal-83">
              Tạo tài khoản trước. Sau khi đăng nhập, bạn có thể thiết lập hồ sơ công ty hoặc chấp
              nhận lời mời tham gia công ty.
            </p>
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
            <fieldset disabled={loading || !ready} className="space-y-5">
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-last-name" className="mb-2 block text-sm font-medium">
                      Họ và tên đệm <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="register-last-name"
                      name="lastName"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nguyễn Văn"
                      className={authInputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="register-first-name" className="mb-2 block text-sm font-medium">
                      Tên <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="register-first-name"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="An"
                      className={authInputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="register-username" className="mb-2 block text-sm font-medium">
                    Tên đăng nhập <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="register-username"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    minLength={3}
                    maxLength={50}
                    aria-describedby="username-hint"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyen_van_an"
                    className={authInputClass}
                  />
                  <p id="username-hint" className="mt-2 text-xs text-charcoal-83">
                    3–50 ký tự: chữ không dấu, số, dấu gạch dưới.
                  </p>
                </div>
              </>
              <div>
                <label htmlFor="register-email" className="mb-2 block text-sm font-medium">
                  Email tài khoản <span aria-hidden="true">*</span>
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@email.com"
                  className={authInputClass}
                />
              </div>
              <PasswordInput
                id="register-password"
                label="Mật khẩu"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                disabled={loading || !ready}
                hint="8–128 ký tự, bao gồm chữ hoa, chữ thường và số."
              />
              <PasswordInput
                id="register-confirmation"
                label="Xác nhận mật khẩu"
                value={confirmation}
                onChange={setConfirmation}
                autoComplete="new-password"
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
                    Đang tạo tài khoản…
                  </>
                ) : (
                  <>
                    Đăng ký {role === "recruiter" ? "tuyển dụng" : "tìm việc"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          <p className="mt-6 text-center text-sm text-charcoal-83">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              search={{ role }}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
