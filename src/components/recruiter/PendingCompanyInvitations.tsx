import { useEffect, useRef, useState } from "react";
import {
  listPendingCompanyInvitations,
  resendCompanyInvitation,
  revokeCompanyInvitation,
  companyInvitationManagementError,
  type OwnerInvitation,
  type CompanyInvitationPage,
} from "@/services/companyInvitations";

const deliveryLabels = {
  PROVIDER_ACCEPTED: "Dịch vụ email đã tiếp nhận yêu cầu gửi",
  FAILED: "Gửi email thất bại",
  UNKNOWN: "Chưa xác nhận kết quả gửi email",
};

export function PendingCompanyInvitations({
  refreshVersion,
  onInvitationChange,
}: {
  refreshVersion: number;
  onInvitationChange: (invitation: OwnerInvitation) => void;
}) {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<CompanyInvitationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmation, setConfirmation] = useState<{
    id: number;
    action: "resend" | "revoke";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [feedback, setFeedback] = useState<{ message: string; failed: boolean } | null>(null);

  async function confirmAction(invitation: OwnerInvitation) {
    if (!confirmation || confirmation.id !== invitation.id || pending.current) return;
    const action = confirmation.action;
    pending.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const updated =
        action === "resend"
          ? await resendCompanyInvitation(invitation.id)
          : await revokeCompanyInvitation(invitation.id);
      onInvitationChange(updated);
      const message =
        action === "revoke"
          ? `Đã thu hồi lời mời tới ${invitation.email}.`
          : updated.status !== "PENDING"
            ? "Lời mời không còn ở trạng thái chờ chấp nhận. Hãy kiểm tra danh sách."
            : updated.deliveryStatus === "PROVIDER_ACCEPTED"
              ? `Đã tạo liên kết mới cho ${invitation.email}. Dịch vụ email đã tiếp nhận yêu cầu gửi; liên kết cũ không còn hiệu lực.`
              : `Đã tạo liên kết mới cho ${invitation.email} nhưng ${updated.deliveryStatus === "FAILED" ? "gửi email thất bại" : "chưa xác nhận được kết quả gửi email"}. Liên kết cũ không còn hiệu lực.`;
      setFeedback({ message, failed: false });
    } catch (cause) {
      setFeedback({ message: companyInvitationManagementError(cause, action), failed: true });
    } finally {
      pending.current = false;
      setBusy(false);
      setConfirmation(null);
      setReload((value) => value + 1);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResult(null);
    listPendingCompanyInvitations(page)
      .then((next) => {
        if (!active) return;
        if (page > 0 && page >= next.totalPages) {
          setPage(Math.max(0, next.totalPages - 1));
          return;
        }
        setResult(next);
      })
      .catch(() => {
        if (active) setError("Không thể tải lời mời đang chờ. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reload, refreshVersion]);

  return (
    <section aria-label="Lời mời đang chờ" aria-busy={loading || busy} className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Lời mời đang chờ{result ? ` (${result.totalElements})` : ""}
        </h2>
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => setReload((value) => value + 1)}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Làm mới lời mời
        </button>
      </div>
      {feedback && (
        <p
          role={feedback.failed ? "alert" : "status"}
          className="mb-4 rounded-lg border border-warm-border p-4 text-sm"
        >
          {feedback.message}
        </p>
      )}
      {loading ? (
        <div
          role="status"
          className="rounded-xl border border-warm-border p-5 text-sm text-charcoal-83"
        >
          Đang tải lời mời…
          <div aria-hidden="true" className="mt-4 h-12 rounded-lg bg-surface-container-low" />
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-warm-border p-5 text-sm">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="mt-2 min-h-11 rounded-lg px-3 font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Tải lại lời mời
          </button>
        </div>
      ) : (
        result &&
        (result.content.length ? (
          <>
            <ul className="divide-y divide-warm-border rounded-xl border border-warm-border bg-paper-white">
              {result.content.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-start justify-between gap-x-8 gap-y-2 p-5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="break-all font-semibold">{invitation.email}</p>
                    <p className="mt-1 text-charcoal-83">Nhà tuyển dụng · Chờ chấp nhận</p>
                  </div>
                  <div className="text-charcoal-83">
                    <p>{deliveryLabels[invitation.deliveryStatus]}</p>
                    <p className="mt-1">
                      Hết hạn:{" "}
                      <time dateTime={invitation.expiresAt}>
                        {new Date(invitation.expiresAt).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </time>{" "}
                      (giờ Việt Nam)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setConfirmation({ id: invitation.id, action: "resend" });
                          setFeedback(null);
                        }}
                        className="min-h-11 rounded-lg px-3 font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                      >
                        Gửi lại lời mời
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setConfirmation({ id: invitation.id, action: "revoke" });
                          setFeedback(null);
                        }}
                        className="min-h-11 rounded-lg px-3 font-semibold text-red-700 hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                      >
                        Thu hồi lời mời
                      </button>
                    </div>
                    {confirmation?.id === invitation.id && (
                      <div
                        role="group"
                        aria-label={
                          confirmation.action === "resend"
                            ? "Xác nhận gửi lại lời mời"
                            : "Xác nhận thu hồi lời mời"
                        }
                        className="mt-2 max-w-prose border-t border-warm-border pt-3"
                      >
                        <p>
                          {confirmation.action === "resend"
                            ? "Gửi lại sẽ tạo liên kết mới và gia hạn lời mời. Liên kết cũ sẽ không còn hiệu lực."
                            : `Thu hồi lời mời tới ${invitation.email}? Người nhận sẽ không thể dùng liên kết này để tham gia công ty.`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void confirmAction(invitation)}
                            className="min-h-11 rounded-lg px-3 font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                          >
                            {busy
                              ? "Đang xử lý…"
                              : confirmation.action === "resend"
                                ? "Gửi lại lời mời"
                                : "Thu hồi lời mời"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmation(null)}
                            className="min-h-11 rounded-lg px-3 hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {result.totalPages > 1 && (
              <nav
                aria-label="Phân trang lời mời"
                className="mt-3 flex flex-wrap items-center gap-4 text-sm"
              >
                <button
                  type="button"
                  disabled={page === 0 || busy}
                  onClick={() => {
                    setConfirmation(null);
                    setPage(page - 1);
                  }}
                  className="min-h-11 rounded-lg px-3 font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  Lời mời trang trước
                </button>
                <span>
                  Trang {page + 1} / {result.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= result.totalPages || busy}
                  onClick={() => {
                    setConfirmation(null);
                    setPage(page + 1);
                  }}
                  className="min-h-11 rounded-lg px-3 font-semibold text-primary hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  Lời mời trang sau
                </button>
              </nav>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-warm-border p-5 text-sm text-charcoal-83">
            Chưa có lời mời đang chờ. Dùng biểu mẫu bên trên để mời thành viên mới.
          </p>
        ))
      )}
    </section>
  );
}
