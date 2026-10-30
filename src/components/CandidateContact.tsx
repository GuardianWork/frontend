import { useEffect, useState } from "react";
import { ApiError } from "@/services/api";
import {
  loadCandidateProfile,
  updateCandidatePhone,
  type CandidateProfile,
} from "@/services/candidateProfile";
export function CandidateContact() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    void loadCandidateProfile()
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
          setPhone(next.phoneNumber || "");
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Không tải được số điện thoại. Hãy thử tải lại thông tin liên hệ.");
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await updateCandidatePhone(profile, phone);
      setProfile(next);
      setPhone(next.phoneNumber || "");
      setNotice(
        next.phoneNumber
          ? "Đã cập nhật số điện thoại chung của tài khoản."
          : "Đã xóa số điện thoại chung của tài khoản.",
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 409
          ? "Số điện thoại đã được sử dụng bởi tài khoản khác."
          : cause instanceof ApiError && cause.status === 400
            ? "Số điện thoại không hợp lệ. Nhập số Việt Nam dạng 0… hoặc +84… rồi thử lại."
            : "Không lưu được số điện thoại. Hãy tải lại thông tin trước khi thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-t border-warm-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-charcoal-40">Điện thoại:</span>
        <span className="font-medium">
          {profile ? profile.phoneNumber || "Chưa cập nhật" : "Đang tải…"}
        </span>
      </div>
      {profile && <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-primary" aria-expanded={editing} aria-controls="candidate-contact-form" onClick={() => setEditing((value) => !value)}>{editing ? "Đóng chỉnh sửa số điện thoại" : "Chỉnh sửa số điện thoại"}</button>}
      {editing && profile && (
        <form id="candidate-contact-form" onSubmit={save} className="mt-4 space-y-3" aria-busy={busy}>
          <label htmlFor="candidate-phone" className="block text-sm font-medium">
            Số điện thoại chung của tài khoản
          </label>
          <input
            id="candidate-phone"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phone}
            disabled={busy}
            maxLength={30}
            onChange={(event) => setPhone(event.target.value)}
            aria-describedby="candidate-phone-hint"
            className="min-h-11 w-full rounded-lg border border-warm-border bg-paper-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-primary"
          />
          <p id="candidate-phone-hint" className="text-sm leading-6 text-charcoal-83">
            Thay đổi áp dụng cho cả tài khoản tuyển dụng. Để trống và lưu để xóa số.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {busy ? "Đang lưu…" : "Lưu số điện thoại"}
          </button>
        </form>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm leading-6 text-charcoal-83">
          {notice}
        </p>
      )}
      {error && (
        <div className="mt-3 text-sm leading-6 text-red-800">
          <p role="alert">{error}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRetry((value) => value + 1)}
            className="mt-2 min-h-11 font-semibold text-primary"
          >
            Tải lại thông tin liên hệ
          </button>
        </div>
      )}
    </div>
  );
}
