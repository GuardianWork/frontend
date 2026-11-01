import { useEmployerOnboarding } from "@/hooks/useEmployerOnboarding";
import { RecipientInvitationPanel } from "@/components/RecipientInvitationPanel";
import { PendingCompanyInvitations } from "@/components/recruiter/PendingCompanyInvitations";
import { getInvitationSecret } from "@/lib/member-email-secret";
import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserPlus } from "lucide-react";
import { RecruiterShell } from "@/components/RecruiterShell";
import { getCurrentUser } from "@/services/auth";
import {
  listBackendCompanyMembers,
  removeBackendCompanyMember,
  type BackendCompanyMember,
} from "@/services/backendCompanyMembers";
import {
  issueCompanyInvitation,
  resendCompanyInvitation,
  companyInvitationError,
  type OwnerInvitation,
} from "@/services/companyInvitations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/rec/members")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Thành viên công ty — GuardianWork" },
    ],
  }),
  component: CompanyMembersPage,
});

function CompanyMembersPage() {
  const onboarding = useEmployerOnboarding();
  const user = getCurrentUser();
  const membership = user?.activeMembership;
  const owner = membership?.companyRole === "OWNER";
  const [members, setMembers] = useState<BackendCompanyMember[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [removing, setRemoving] = useState<BackendCompanyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const removalPending = useRef(false);
  const [removalError, setRemovalError] = useState("");
  const [removalNotice, setRemovalNotice] = useState("");
  useEffect(() => {
    let active = true;
    setMembers([]);
    setError("");
    setLoading(owner);
    if (owner) {
      listBackendCompanyMembers(page)
        .then((result) => {
          if (!active) return;
          if (page > 0 && page >= result.totalPages) {
            setPage(Math.max(0, result.totalPages - 1));
            return;
          }
          setMembers(result.content);
          setTotal(result.totalElements);
          setTotalPages(result.totalPages);
        })
        .catch((cause) => {
          if (active)
            setError(cause instanceof Error ? cause.message : "Không thể tải thành viên.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [owner, membership?.companyId, page, reload]);
  async function removeMember() {
    if (!removing || removalPending.current) return;
    removalPending.current = true;
    setSaving(true);
    setRemovalError("");
    setRemovalNotice("");
    try {
      await removeBackendCompanyMember(removing.membershipId);
      setRemovalNotice(`Đã xóa ${removing.email} khỏi công ty.`);
      setRemoving(null);
      if (members.length === 1 && page > 0) setPage(page - 1);
      else setReload((value) => value + 1);
    } catch (cause) {
      setRemovalError(
        cause instanceof Error ? cause.message : "Không thể xóa thành viên. Vui lòng thử lại.",
      );
    } finally {
      removalPending.current = false;
      setSaving(false);
    }
  }
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [invitationResult, setInvitationResult] = useState<OwnerInvitation | null>(null);
  const [invitationError, setInvitationError] = useState("");
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [invitationRefresh, setInvitationRefresh] = useState(0);
  const invitationPending = useRef(false);
  const canInvite = owner;
  async function sendInvitation(resend = false) {
    if (!canInvite || invitationPending.current || (resend && !invitationResult)) return;
    invitationPending.current = true;
    setSendingInvitation(true);
    setInvitationError("");
    try {
      const result =
        resend && invitationResult
          ? await resendCompanyInvitation(invitationResult.id)
          : await issueCompanyInvitation(email);
      setInvitationResult(result);
      if (!resend) setEmail("");
    } catch (cause) {
      setInvitationError(companyInvitationError(cause));
    } finally {
      invitationPending.current = false;
      setSendingInvitation(false);
      setInvitationRefresh((value) => value + 1);
    }
  }
  if (onboarding?.onboarding.stage === "COMPANY_ACTION_REQUIRED" || getInvitationSecret())
    return (
      <RecruiterShell title="Lời mời công ty">
        <RecipientInvitationPanel />
      </RecruiterShell>
    );
  return (
    <RecruiterShell title="Thành viên công ty">
      <div className="workspace-heading">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Users className="text-primary" />
            Thành viên công ty
          </h1>
          <p className="mt-2 text-sm text-charcoal-83 [overflow-wrap:anywhere]">
            {membership?.companyName || "Không gian doanh nghiệp"}
          </p>
          <p className="mt-3 text-sm text-charcoal-83">
            Quản lý thành viên công ty và gửi lời mời tham gia.
          </p>
        </div>
        {membership && (
          <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold">
            Vai trò của bạn:{" "}
            {membership.companyRole === "OWNER"
              ? "Chủ sở hữu công ty"
              : membership.companyRole === "ADMIN"
                ? "Quản trị viên công ty"
                : "Nhà tuyển dụng"}
          </span>
        )}
      </div>
      {removalNotice && (
        <p role="status" className="mb-4 text-sm">
          {removalNotice}
        </p>
      )}
      {error && (
        <div role="alert" className="mb-5 rounded-lg border border-warm-border p-4 text-sm">
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 font-semibold text-primary"
            onClick={() => setReload((value) => value + 1)}
          >
            Thử lại
          </button>
        </div>
      )}
      {!owner && (
        <p className="mb-4 rounded-lg border border-warm-border p-4 text-sm">
          Chỉ chủ sở hữu được xem danh sách và quản lý thành viên công ty.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendInvitation();
        }}
        className="mb-6 rounded-xl border border-warm-border bg-paper-white p-5"
        aria-busy={sendingInvitation}
      >
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UserPlus size={19} />
          Mời thành viên
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 basis-full sm:basis-auto">
            <span className="mb-2 block text-sm font-medium">Email thành viên</span>
            <input
              disabled={!canInvite || sendingInvitation}
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email tài khoản nhà tuyển dụng"
              className="w-full rounded-lg border border-warm-border bg-surface-container-low px-3 py-2 text-base"
            />
          </label>
          <button
            className="recruiter-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canInvite || sendingInvitation}
            title={
              !canInvite ? "Chỉ chủ sở hữu của công ty đã xác thực được mời thành viên" : undefined
            }
          >
            {sendingInvitation ? "Đang gửi…" : "Tạo lời mời"}
          </button>
        </div>
        <p className="mt-3 text-sm text-charcoal-83">
          Thành viên mới có vai trò Nhà tuyển dụng. Hệ thống sẽ gửi liên kết lời mời qua email. Việc
          tạo lời mời chưa cấp quyền thành viên.
        </p>
      </form>
      {invitationError && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-warm-border bg-paper-white p-4 text-sm"
        >
          {invitationError}
        </p>
      )}
      {invitationResult && (
        <section
          aria-label="Kết quả lời mời"
          className="mb-6 rounded-xl border border-warm-border bg-paper-white p-5"
        >
          <h2 className="break-words font-semibold">Lời mời: {invitationResult.email}</h2>
          <p role="status" className="mt-3 text-sm leading-6 text-charcoal-83">
            {invitationResult.deliveryStatus === "PROVIDER_ACCEPTED"
              ? "Đã tạo lời mời. Dịch vụ email đã tiếp nhận yêu cầu gửi; người nhận cần kiểm tra hộp thư và thư rác."
              : invitationResult.deliveryStatus === "FAILED"
                ? "Lời mời đã được lưu nhưng gửi email thất bại. Bạn có thể gửi lại lời mời."
                : "Lời mời đã được lưu nhưng chưa xác nhận được kết quả gửi email. Bạn có thể gửi lại lời mời."}
          </p>
          <p className="mt-2 text-sm leading-6 text-charcoal-83">
            Hết hạn:{" "}
            {new Date(invitationResult.expiresAt).toLocaleString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}{" "}
            (giờ Việt Nam)
          </p>
          {invitationResult.status === "PENDING" &&
            invitationResult.deliveryStatus !== "PROVIDER_ACCEPTED" && (
              <button
                type="button"
                disabled={!canInvite || sendingInvitation}
                onClick={() => void sendInvitation(true)}
                className="recruiter-primary mt-4"
              >
                {sendingInvitation ? "Đang gửi…" : "Gửi lại lời mời"}
              </button>
            )}
        </section>
      )}
      {owner && (
        <PendingCompanyInvitations
          key={membership?.companyId}
          refreshVersion={invitationRefresh}
          onInvitationChange={(updated) =>
            setInvitationResult((current) =>
              current?.id === updated.id
                ? updated.status === "PENDING"
                  ? updated
                  : null
                : current,
            )
          }
        />
      )}
      {owner && (
        <section aria-label="Danh sách thành viên công ty" aria-busy={loading}>
          <h2 className="mb-4 text-xl font-semibold">
            Thành viên ({loading || error ? "…" : total})
          </h2>
          <ListSearch
            value={query}
            onChange={setQuery}
            label="Tìm tên hoặc email trong trang hiện tại"
          />
          {loading ? (
            <p role="status" className="py-8">
              Đang tải thành viên…
            </p>
          ) : (
            !error && (
              <>
                <div
                  role="region"
                  aria-label="Bảng thành viên công ty"
                  tabIndex={0}
                  className="overflow-x-auto rounded-xl border border-warm-border bg-paper-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <table className="w-full min-w-[640px] table-fixed text-left text-sm recruiter-members-table">
                    <thead className="bg-surface-container-low">
                      <tr>
                        {["Thành viên", "Vai trò", "Trạng thái", "Thao tác"].map((label) => (
                          <th key={label} scope="col" className="p-4">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .filter((m) =>
                          matchesSearch(
                            query,
                            m.firstName || "",
                            m.lastName || "",
                            m.email,
                            m.companyRole,
                          ),
                        )
                        .map((m) => (
                          <tr key={m.membershipId} className="border-t border-warm-border">
                            <td className="p-4">
                              <p className="font-semibold [overflow-wrap:anywhere]">
                                {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email}
                                {m.userId === user?.id ? " (Bạn)" : ""}
                              </p>
                              <p className="mt-1 text-charcoal-83 [overflow-wrap:anywhere]">
                                {m.email}
                              </p>
                            </td>
                            <td className="p-4">
                              {m.companyRole === "OWNER"
                                ? "Chủ sở hữu công ty"
                                : m.companyRole === "ADMIN"
                                  ? "Quản trị viên công ty"
                                  : "Nhà tuyển dụng"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`status-tag status-tag--${m.status === "ACTIVE" ? "success" : m.status === "LEFT" ? "neutral" : "danger"}`}
                              >
                                {m.status === "ACTIVE"
                                  ? "Đang hoạt động"
                                  : m.status === "LEFT"
                                    ? "Đã rời công ty"
                                    : "Đã bị xóa"}
                              </span>
                            </td>
                            <td className="p-4">
                              {m.companyRole === "RECRUITER" && m.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  disabled={saving}
                                  className="text-red-700 disabled:opacity-50"
                                  onClick={() => {
                                    setRemovalError("");
                                    setRemoving(m);
                                  }}
                                >
                                  Xóa thành viên
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      {!members.some((m) =>
                        matchesSearch(
                          query,
                          m.firstName || "",
                          m.lastName || "",
                          m.email,
                          m.companyRole,
                        ),
                      ) && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-charcoal-83">
                            Không tìm thấy thành viên phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <nav aria-label="Phân trang thành viên" className="mt-4 flex items-center gap-4">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      className="disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <span>
                      Trang {page + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </nav>
                )}
              </>
            )
          )}
        </section>
      )}
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !saving) setRemoving(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa thành viên</DialogTitle>
            <DialogDescription className="[overflow-wrap:anywhere]">
              Bạn muốn xóa {removing?.email} khỏi công ty? Thành viên sẽ mất quyền truy cập dữ liệu
              công ty.
            </DialogDescription>
          </DialogHeader>
          {removalError && (
            <p role="alert" className="text-sm text-red-700">
              {removalError}
            </p>
          )}
          <div className="flex justify-end gap-4">
            <button type="button" disabled={saving} onClick={() => setRemoving(null)}>
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              className="recruiter-primary"
              onClick={() => void removeMember()}
            >
              {saving ? "Đang xóa…" : "Xóa thành viên"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterShell>
  );
}
