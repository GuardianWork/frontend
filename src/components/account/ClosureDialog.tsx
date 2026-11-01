import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  accountError,
  confirmClosure,
  requestClosureCode,
  isoTime,
  type ClosureAction,
  type CodeDelivery,
} from "@/services/accountControl";
import { ApiError } from "@/services/api";
import { useCodeCooldown } from "@/hooks/useCodeCooldown";
import { CodeChallenge } from "./CodeChallenge";

export function ClosureDialog({
  action,
  email,
  close,
  refresh,
}: {
  action: ClosureAction;
  email: string;
  close: () => void;
  refresh: () => Promise<unknown>;
}) {
  const deletion = action === "deletion";
  const title = deletion ? "Yêu cầu xóa tài khoản" : "Tạm ngừng tài khoản";
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [ack, setAck] = useState(false);
  const [delivery, setDelivery] = useState<CodeDelivery | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const cooldown = useCodeCooldown();
  const expired = !!delivery?.expiresAt && cooldown.now >= isoTime(delivery.expiresAt);
  const client = useQueryClient();
  const navigate = useNavigate();
  async function request() {
    if (lock.current || cooldown.seconds || !password) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestClosureCode(action, password);
      cooldown.accept(result);
      setDelivery(result);
      setCode("");
      setAck(false);
      setNotice(
        result.deliveryAccepted
          ? `Yêu cầu gửi mã ${deletion ? "xóa tài khoản" : "tạm ngừng"} đến ${email} đã được chấp nhận. Tài khoản chưa thay đổi.`
          : "Yêu cầu gửi mã chưa được chấp nhận. Tài khoản chưa thay đổi. Bạn có thể thử lại sau thời gian chờ.",
      );
    } catch (cause) {
      cooldown.reject(cause);
      setError(accountError(cause, action));
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
      await confirmClosure(action, password, code, ack);
      setPassword("");
      setCode("");
      setAck(false);
      client.clear();
      await navigate({
        to: "/login",
        search: { notice: deletion ? "deletion-pending" : "deactivated" },
        replace: true,
      });
    } catch (cause) {
      setError(accountError(cause, action));
      if (cause instanceof ApiError && (cause.status === 0 || cause.status >= 500))
        setUncertain(true);
      if (cause instanceof ApiError && [403, 409].includes(cause.status)) {
        setUncertain(true);
        void refresh().catch(() =>
          setError(
            "Điều kiện tài khoản đã thay đổi. Chưa tải lại được trạng thái; hãy đóng hộp thoại và tải lại tài khoản.",
          ),
        );
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) close();
      }}
    >
      <DialogContent className="account-dialog" aria-busy={busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Đọc hậu quả và xác nhận bằng mật khẩu hiện tại cùng mã gửi đến email đã đăng ký.
          </DialogDescription>
        </DialogHeader>
        <ul className="account-consequences">
          <li>
            Quyền truy cập thông thường dừng ngay; mọi phiên đăng nhập hiện tại bị vô hiệu hóa.
          </li>
          <li>
            Hồ sơ ứng viên sẽ bị ẩn. Lịch sử ứng tuyển và các bản ghi trước đó vẫn được giữ lại.
          </li>
          <li>
            {deletion
              ? "Đây là yêu cầu xóa đang chờ xử lý, không phải xóa vĩnh viễn ngay. Chưa có ngày hoàn tất được cam kết. Chỉ có thể hủy khi yêu cầu còn đang chờ."
              : "Bạn có thể yêu cầu kích hoạt lại bằng mật khẩu hiện tại và mã email nếu tài khoản đủ điều kiện. Khôi phục không khôi phục các phiên hay tư cách thành viên công ty đã rời."}
          </li>
        </ul>
        <form className="account-form" onSubmit={confirm}>
          <PasswordInput
            id="closure-password"
            label="Mật khẩu hiện tại"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setCode("");
              setAck(false);
            }}
            autoComplete="current-password"
            disabled={busy || uncertain}
          />
          <button
            type="button"
            className="account-button account-button--quiet"
            disabled={busy || uncertain || !password || cooldown.seconds > 0}
            onClick={() => void request()}
          >
            {busy
              ? "Đang xử lý…"
              : cooldown.seconds
                ? `Gửi lại sau ${cooldown.seconds} giây`
                : delivery
                  ? "Gửi lại mã cho thao tác này"
                  : "Gửi mã xác nhận"}
          </button>
          {delivery?.deliveryAccepted && (
            <CodeChallenge
              id="closure-code"
              value={code}
              onChange={setCode}
              delivery={delivery}
              disabled={busy || expired || uncertain}
              acknowledged={ack}
              onAcknowledge={setAck}
              acknowledgement={`Tôi hiểu các hậu quả và muốn ${deletion ? "gửi yêu cầu xóa đang chờ xử lý" : "tạm ngừng tài khoản"}.`}
            />
          )}
          {expired && <p role="status">Mã đã hết hạn. Hãy gửi lại mã để tiếp tục.</p>}
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
            <button
              type="button"
              disabled={busy}
              className="account-button account-button--quiet"
              onClick={async () => {
                if (lock.current) return;
                lock.current = true;
                setBusy(true);
                try {
                  await refresh();
                  close();
                } catch {
                  setError(
                    "Không tải được trạng thái. Đóng hộp thoại và tải lại tài khoản trước khi thử lại.",
                  );
                } finally {
                  lock.current = false;
                  setBusy(false);
                }
              }}
            >
              Kiểm tra lại trạng thái tài khoản
            </button>
          )}
          <div className="account-actions">
            <button
              type="button"
              className="account-button account-button--quiet"
              disabled={busy}
              onClick={close}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={deletion ? "account-button account-button--danger" : "account-button"}
              disabled={
                busy ||
                uncertain ||
                !delivery?.deliveryAccepted ||
                expired ||
                !ack ||
                !/^[0-9]{6}$/.test(code) ||
                !password
              }
            >
              {busy ? "Đang xác nhận…" : title}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
