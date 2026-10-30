import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { loadCurrentUser } from "@/services/auth";
import { ApiError } from "@/services/api";
import { confirmEmailVerification, requestEmailVerification } from "@/services/emailVerification";

export function EmailVerificationPanel() {
  const user = useAuthUser();
  const [operation, setOperation] = useState<"request" | "confirm" | "refresh" | null>(null);
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nextRequestAt, setNextRequestAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const busy = operation !== null;
  const expired = expiresAt > 0 && now >= expiresAt;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function refreshVerification() {
    if (busy) return;
    setOperation("refresh");
    setError("");
    try {
      const current = await loadCurrentUser();
      setMessage(
        current.recruitingEmailEligible
          ? "Email đã được xác minh."
          : "Email chưa được xác minh. Nhập mã 6 chữ số trong email để xác nhận.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải trạng thái xác minh. Vui lòng thử lại.",
      );
    } finally {
      setOperation(null);
    }
  }
  async function request() {
    if (busy) return;
    setOperation("request");
    setError("");
    setMessage("");
    try {
      const result = await requestEmailVerification();
      setNow(Date.now());
      setNextRequestAt(result.nextRequestAt ? Date.parse(result.nextRequestAt) : 0);
      setExpiresAt(result.expiresAt ? Date.parse(result.expiresAt) : 0);
      setCode("");
      setMessage(
        result.alreadyVerified
          ? "Email đã được xác minh."
          : result.deliveryAccepted
            ? "Yêu cầu gửi mã đã được chấp nhận. Kiểm tra hộp thư và thư rác. Mỗi lần gửi lại sẽ thay thế mã trước đó."
            : "Chưa gửi được mã xác minh. Vui lòng thử lại sau thời gian chờ.",
      );
      if (result.alreadyVerified) {
        setConfirmed(true);
        await loadCurrentUser();
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 429) {
        setNow(Date.now());
        setNextRequestAt(Date.now() + (cause.retryAfterSeconds ?? 60) * 1000);
        setError("Bạn vừa yêu cầu mã. Vui lòng chờ trước khi gửi lại.");
      } else
        setError(cause instanceof Error ? cause.message : "Không thể gửi mã. Vui lòng thử lại.");
    } finally {
      setOperation(null);
    }
  }
  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmed) return;
    setError("");
    setMessage("");
    if (!/^[0-9]{6}$/.test(code)) {
      setError("Nhập đúng 6 chữ số trong email xác minh.");
      return;
    }
    setOperation("confirm");
    try {
      await confirmEmailVerification(code);
      setCode("");
      setConfirmed(true);
      setMessage("Email đã được xác minh.");
      try {
        await loadCurrentUser();
      } catch {
        setError(
          "Email đã được xác minh nhưng chưa tải được quyền tài khoản. Chọn cập nhật trạng thái để thử lại.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 400
          ? "Mã không hợp lệ, đã hết hạn hoặc không còn sử dụng được. Kiểm tra mã mới nhất; nếu vẫn không được, hãy yêu cầu mã mới."
          : cause instanceof Error
            ? cause.message
            : "Không thể xác minh email. Vui lòng thử lại.",
      );
    } finally {
      setOperation(null);
    }
  }
  return (
    <section
      className="mb-6 rounded-lg border border-warm-border bg-paper-white p-5"
      aria-labelledby="email-proof-title"
    >
      <h2 id="email-proof-title" className="text-lg font-semibold">
        Xác minh email để tuyển dụng
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal-83">
        Xác minh {user?.email} trước khi đăng ký công ty, nhận lời mời hoặc quản lý tuyển dụng. Bạn
        vẫn có thể sử dụng không gian ứng viên.
      </p>
      {!confirmed && (
        <>
          <button
            type="button"
            onClick={() => void request()}
            disabled={busy || nextRequestAt > now}
            className="recruiter-primary mt-4 min-h-11 disabled:opacity-60"
          >
            {operation === "request"
              ? "Đang gửi mã…"
              : nextRequestAt > now
                ? `Gửi lại sau ${Math.ceil((nextRequestAt - now) / 1000)} giây`
                : "Gửi mã xác minh"}
          </button>
          <form onSubmit={confirm} className="mt-5" aria-busy={operation === "confirm"}>
            <label htmlFor="email-verification-code" className="block text-sm font-semibold">
              Mã xác minh 6 chữ số
            </label>
            <p id="email-code-hint" className="mt-2 max-w-2xl text-sm leading-6 text-charcoal-83">
              Mã có hiệu lực 10 phút. Nhập sai 5 lần sẽ làm mã mất hiệu lực. Không chia sẻ mã với
              người khác.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                id="email-verification-code"
                name="emailVerificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={busy || expired}
                aria-describedby="email-code-hint"
                className="min-h-11 w-full rounded-lg border border-warm-border bg-paper-white px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 sm:w-48"
              />
              <button
                type="submit"
                disabled={busy || expired || !/^[0-9]{6}$/.test(code)}
                className="recruiter-primary min-h-11 disabled:opacity-60"
              >
                {operation === "confirm" ? "Đang xác minh…" : "Xác nhận mã"}
              </button>
            </div>
            {expired && (
              <p role="status" className="mt-3 text-sm leading-6">
                Mã đã hết hạn. Hãy gửi yêu cầu để nhận mã mới.
              </p>
            )}
          </form>
        </>
      )}
      <button
        type="button"
        onClick={() => void refreshVerification()}
        disabled={busy}
        className="mt-3 min-h-11 rounded-lg border border-warm-border px-4 text-sm font-semibold disabled:opacity-60"
      >
        {operation === "refresh" ? "Đang cập nhật…" : "Cập nhật trạng thái xác minh"}
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm leading-6">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
