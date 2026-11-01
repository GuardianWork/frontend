import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Users } from "lucide-react";
import { useEmployerOnboarding } from "@/hooks/useEmployerOnboarding";
import { useAuthUser } from "@/hooks/useAuthUser";
import { clearInvitationSecret, getInvitationSecret } from "@/lib/member-email-secret";
import {
  previewInvitation,
  acceptInvitation,
  recipientInvitationError,
  type InvitationPreview,
} from "@/services/recipientInvitations";
export function RecipientInvitationPanel() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const context = useEmployerOnboarding();
  const [secret, setSecret] = useState(getInvitationSecret);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  async function run(accept: boolean) {
    if (lock.current || !secret || (accept && (!confirmed || !preview))) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!accept) setPreview(await previewInvitation(secret));
      else {
        await acceptInvitation(secret);
        clearInvitationSecret();
        setSecret(null);
        setAccepted(true);
        await context?.refresh();
        await navigate({ to: "/rec" });
      }
    } catch (cause) {
      setError(recipientInvitationError(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby="invitation-title"
      aria-busy={busy}
      className="mx-auto max-w-3xl rounded-xl border border-warm-border bg-paper-white p-5 sm:p-8"
    >
      {secret ? (
        <Users size={30} className="mb-4 text-primary" aria-hidden="true" />
      ) : (
        <Mail size={30} className="mb-4 text-primary" aria-hidden="true" />
      )}
      <h1 id="invitation-title" className="text-2xl font-bold">
        {accepted ? "Đã chấp nhận lời mời" : "Lời mời tham gia công ty"}
      </h1>
      <p className="mt-3 break-words text-base leading-7 text-charcoal-83">
        {accepted
          ? "Tư cách thành viên đã được máy chủ xác nhận. Chức năng mở theo quyền công ty của bạn."
          : secret
            ? `Bạn đang đăng nhập bằng ${user?.email || "tài khoản hiện tại"}. Xem thông tin và xác nhận trước khi tham gia.`
            : "Mở liên kết trong email mời bằng tài khoản nhận lời mời để xem và chấp nhận. Nếu chưa nhận được, hãy liên hệ chủ sở hữu công ty."}
      </p>
      {preview && !accepted && (
        <div className="mt-6 border-y border-warm-border py-5">
          <h2 className="break-words text-xl font-semibold">{preview.companyName}</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal-83">
            Vai trò: Nhà tuyển dụng · Hết hạn: {new Date(preview.expiresAt).toLocaleString("vi-VN")}
          </p>
          <label className="mt-5 flex items-start gap-3 text-base leading-6">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-primary"
            />
            Tôi đồng ý tham gia công ty này với vai trò Nhà tuyển dụng.
          </label>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {secret && (
          <button
            type="button"
            disabled={busy || (Boolean(preview) && !confirmed)}
            onClick={() => void run(Boolean(preview))}
            className="recruiter-primary min-h-11 disabled:opacity-60"
          >
            {busy ? "Đang xử lý…" : preview ? "Chấp nhận lời mời" : "Xem thông tin lời mời"}
          </button>
        )}
        {accepted ? (
          <Link to="/rec" className="recruiter-primary inline-flex min-h-11 items-center">
            Về không gian tuyển dụng
          </Link>
        ) : (
          <Link
            to="/rec/verification"
            className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary"
          >
            Đăng ký công ty của bạn
          </Link>
        )}
      </div>
    </section>
  );
}
