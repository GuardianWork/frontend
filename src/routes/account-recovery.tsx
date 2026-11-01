import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useCodeCooldown } from "@/hooks/useCodeCooldown";
import { CodeChallenge } from "@/components/account/CodeChallenge";
import {
  accountError,
  confirmRecovery,
  requestRecoveryCode,
  isoTime,
  type RecoveryAction,
  type CodeDelivery,
} from "@/services/accountControl";
import { clearAuthSession } from "@/services/auth";
import { ApiError } from "@/services/api";
import "@/components/account/account.css";

export const Route = createFileRoute("/account-recovery")({
  head: () => ({
    meta: [
      { title: "Khôi phục tài khoản — GuardianWork" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RecoveryPage,
});
function RecoveryPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState<RecoveryAction>("REACTIVATE");
  const [code, setCode] = useState("");
  const [ack, setAck] = useState(false);
  const [delivery, setDelivery] = useState<CodeDelivery | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const cooldown = useCodeCooldown();
  const navigate = Route.useNavigate();
  const client = useQueryClient();
  const expired = !!delivery?.expiresAt && cooldown.now >= isoTime(delivery.expiresAt);
  function resetProof() {
    setDelivery(null);
    setCode("");
    setAck(false);
    setError("");
    setNotice("");
    setUncertain(false);
  }
  async function request(event?: React.FormEvent) {
    event?.preventDefault();
    if (lock.current || cooldown.seconds || !identifier.trim() || !password) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestRecoveryCode({ usernameOrEmail: identifier, password, action });
      cooldown.accept(result);
      setDelivery(result);
      setCode("");
      setAck(false);
      setUncertain(false);
      setNotice(
        result.deliveryAccepted
          ? "Yêu cầu gửi mã đến email đã đăng ký được chấp nhận. Tài khoản chưa được khôi phục. Kiểm tra hộp thư và thư rác."
          : "Yêu cầu gửi mã chưa được chấp nhận. Hãy thử lại sau thời gian chờ. Tài khoản chưa thay đổi.",
      );
    } catch (cause) {
      cooldown.reject(cause);
      setError(accountError(cause, "recovery"));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (
      lock.current ||
      !delivery?.deliveryAccepted ||
      !ack ||
      !/^[0-9]{6}$/.test(code) ||
      expired ||
      uncertain
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await confirmRecovery({ usernameOrEmail: identifier, password, action }, code, ack);
      setIdentifier("");
      setPassword("");
      setCode("");
      setAck(false);
      setDelivery(null);
      clearAuthSession();
      client.clear();
      await navigate({
        to: "/login",
        search: { notice: action === "REACTIVATE" ? "reactivated" : "deletion-cancelled" },
        replace: true,
      });
    } catch (cause) {
      setError(accountError(cause, "recovery"));
      if (cause instanceof ApiError && (cause.status === 0 || cause.status >= 500))
        setUncertain(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout mode="login" purpose="candidate">
      <div className="account-recovery">
        <h1>Khôi phục tài khoản</h1>
        <p>
          Chỉ dành cho tài khoản tự tạm ngừng hoặc có yêu cầu xóa đang chờ. Tài khoản bị cấm không
          thể khôi phục qua quy trình này.
        </p>
        <form
          className="account-form"
          onSubmit={delivery?.deliveryAccepted ? confirm : request}
          aria-busy={busy}
        >
          <div className="account-field">
            <label htmlFor="recovery-action">Bạn muốn thực hiện thao tác nào?</label>
            <select
              id="recovery-action"
              value={action}
              disabled={busy || !ready}
              onChange={(e) => {
                setAction(e.target.value as RecoveryAction);
                resetProof();
              }}
            >
              <option value="REACTIVATE">Kích hoạt lại tài khoản</option>
              <option value="CANCEL_DELETION">Hủy yêu cầu xóa tài khoản</option>
            </select>
          </div>
          <div className="account-field">
            <label htmlFor="recovery-identifier">Email hoặc tên đăng nhập</label>
            <input
              id="recovery-identifier"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              value={identifier}
              disabled={busy || !ready}
              onChange={(e) => {
                setIdentifier(e.target.value);
                resetProof();
              }}
            />
          </div>
          <PasswordInput
            id="recovery-password"
            label="Mật khẩu hiện tại"
            value={password}
            onChange={(value) => {
              setPassword(value);
              resetProof();
            }}
            autoComplete="current-password"
            disabled={busy || !ready}
          />
          <p>
            Chúng tôi chỉ gửi mã đến email đã đăng ký. Khi khôi phục thành công, tùy chọn hiển thị
            hồ sơ ứng viên trước đây được khôi phục; các phiên đăng nhập, tư cách thành viên công ty
            đã rời và phân công cũ không được khôi phục.
          </p>
          {delivery?.deliveryAccepted && (
            <CodeChallenge
              id="recovery-code"
              value={code}
              onChange={setCode}
              delivery={delivery}
              disabled={busy || expired || uncertain}
              acknowledged={ack}
              onAcknowledge={setAck}
              acknowledgement={`Tôi hiểu các thay đổi và muốn ${action === "REACTIVATE" ? "kích hoạt lại tài khoản" : "hủy yêu cầu xóa tài khoản đang chờ"}.`}
            />
          )}
          {expired && <p role="status">Mã đã hết hạn. Hãy gửi lại mã mới.</p>}
          {notice && (
            <p role="status" className="account-feedback">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="account-feedback account-error">
              {error}
            </p>
          )}
          {uncertain && (
            <p className="account-feedback">
              Chưa xác định được kết quả. Hãy thử đăng nhập bình thường để kiểm tra. Nếu vẫn chưa
              truy cập được, chỉ yêu cầu mã mới sau thời gian chờ.
            </p>
          )}
          <div className="account-actions">
            <button
              type={delivery?.deliveryAccepted ? "button" : "submit"}
              onClick={delivery?.deliveryAccepted ? () => void request() : undefined}
              disabled={busy || cooldown.seconds > 0 || !identifier.trim() || !password}
              className="account-button account-button--quiet"
            >
              {cooldown.seconds
                ? `Gửi lại sau ${cooldown.seconds} giây`
                : delivery
                  ? "Gửi lại mã khôi phục"
                  : "Gửi mã khôi phục"}
            </button>
            {delivery?.deliveryAccepted && (
              <button
                type="submit"
                className="account-button"
                disabled={busy || expired || uncertain || !ack || !/^[0-9]{6}$/.test(code)}
              >
                {busy
                  ? "Đang xử lý…"
                  : action === "REACTIVATE"
                    ? "Kích hoạt lại tài khoản"
                    : "Hủy yêu cầu xóa tài khoản"}
              </button>
            )}
          </div>
        </form>
        <Link to="/login" className="account-button account-button--quiet">
          Về đăng nhập
        </Link>
      </div>
    </AuthLayout>
  );
}
