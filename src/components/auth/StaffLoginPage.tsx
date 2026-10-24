import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { PasswordInput, authInputClass } from "./PasswordInput";
import {
  hasAuthSession,
  isStaffUser,
  loadCurrentUser,
  loginAccount,
  logoutAccount,
  saveAuthSession,
} from "@/services/auth";
import "./staff-login.css";

export function StaffLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasAuthSession()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void loadCurrentUser()
      .then(async (user) => {
        if (cancelled) return;
        if (isStaffUser(user)) await navigate({ to: "/staff", replace: true });
        else await logoutAccount();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading || !ready) return;
    if (!identifier.trim()) {
      setError("Vui lòng nhập email hoặc tên đăng nhập.");
      return;
    }
    setLoading(true);
    setError("");
    let stored = false;
    try {
      const session = await loginAccount(identifier, password);
      saveAuthSession(session);
      stored = true;
      const user = await loadCurrentUser();
      if (!isStaffUser(user))
        throw new Error("Tài khoản này không có quyền truy cập Platform staff.");
      await navigate({ to: "/staff", replace: true });
    } catch (cause) {
      if (stored) {
        const revocation = logoutAccount();
        void revocation.catch(() => {});
      }
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="staff-login-page">
      <div className="staff-login-container">
        <div className="staff-login-brand">
          <span>
            <ShieldCheck size={26} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <strong>GuardianWork</strong>
        </div>
        <section className="staff-login-form-panel" aria-labelledby="staff-login-title">
          <h1 id="staff-login-title">Đăng nhập Platform staff</h1>
          <p className="staff-login-description">
            Sử dụng tài khoản staff để truy cập không gian làm việc.
          </p>
          <form onSubmit={submit} aria-busy={loading}>
            {error && (
              <p role="alert" id="staff-login-error" className="staff-login-error">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="login-identifier">Email hoặc tên đăng nhập</label>
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
                placeholder="Email hoặc tên đăng nhập"
                disabled={loading || !ready}
                className={authInputClass}
                aria-describedby={error ? "staff-login-error" : undefined}
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
            <button type="submit" className="staff-login-submit" disabled={loading || !ready}>
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Đang đăng
                  nhập…
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
