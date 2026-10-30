import { useEmployerOnboarding } from "@/hooks/useEmployerOnboarding";
import { RecipientInvitationPanel } from "@/components/RecipientInvitationPanel";
import { getInvitationSecret } from "@/lib/member-email-secret";
import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserPlus, ShieldCheck, History } from "lucide-react";
import { RecruiterShell } from "@/components/RecruiterShell";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import {
  canViewMemberData,
  updateCompanyMembers,
  type MemberAction,
} from "@/services/companyMembers";
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

export const Route = createFileRoute("/recruiter/members")({
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
  const { workspace, company, member, user, error } = useCompanyWorkspace();
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [invitationResult, setInvitationResult] = useState<OwnerInvitation | null>(null);
  const [invitationError, setInvitationError] = useState("");
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const invitationPending = useRef(false);
  const canInvite =
    user?.activeMembership?.companyRole === "OWNER" && company?.verificationStatus === "VERIFIED";
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
    }
  }
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const owner = member?.role === "Owner";
  const selected = workspace.members.find((m) => m.id === selectedId);
  const removing = workspace.members.find((m) => m.id === removingId);
  const run = (action: MemberAction) => {
    try {
      updateCompanyMembers(action);
      setFailed(false);
      setMessage("Đã lưu thay đổi.");
      return true;
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : "Không thể lưu thay đổi.");
      return false;
    }
  };
  const invitation = workspace.members.find(
    (m) => m.status === "invited" && m.email === user?.email.toLowerCase(),
  );
  const activeMembers = workspace.members.filter((m) => m.status === "active");
  if (onboarding?.onboarding.stage === "COMPANY_ACTION_REQUIRED" || getInvitationSecret())
    return (
      <RecruiterShell title="Lời mời công ty">
        <RecipientInvitationPanel />
      </RecruiterShell>
    );
  return (
    <RecruiterShell title="Thành viên công ty">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-charcoal-83">
            {company?.name || "Không gian doanh nghiệp"}
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Users className="text-primary" />
            Thành viên công ty
          </h1>
          <p className="mt-3 text-sm text-charcoal-83">
            Quản lý đội ngũ, vai trò và quyền xem dữ liệu tuyển dụng.
          </p>
        </div>
        {member && (
          <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold">
            Vai trò của bạn: {member.role}
          </span>
        )}
      </div>
      {(message || error) && (
        <p
          role={failed || error ? "alert" : "status"}
          className="mb-5 rounded-lg border border-warm-border bg-paper-white p-4 text-sm"
        >
          {error || message}
        </p>
      )}
      {!owner && (
        <p className="mb-4 rounded-lg border border-warm-border bg-surface-container-low p-4 text-sm">
          Chỉ Owner của công ty đã xác thực được mời, xóa thành viên, đổi vai trò và phân quyền. Bạn
          vẫn có thể xem lịch sử đăng tin và đơn ứng tuyển trong phạm vi quyền được cấp.
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
        <div className="flex flex-wrap gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Email thành viên</span>
            <input
              disabled={!canInvite || sendingInvitation}
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email tài khoản nhà tuyển dụng"
              className="w-full rounded-lg border border-warm-border bg-surface-container-low px-3 py-2 text-sm"
            />
          </label>
          <button
            className="recruiter-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canInvite || sendingInvitation}
            title={!canInvite ? "Chỉ Owner của công ty đã xác thực được mời thành viên" : undefined}
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
      {!company ? (
        <p>Đang tải công ty…</p>
      ) : company.verificationStatus !== "VERIFIED" ? (
        <div className="rounded-xl border border-warm-border bg-paper-white p-8">
          <ShieldCheck className="mb-4 text-primary" />
          <h2 className="text-xl font-semibold">Công ty cần được xác thực</h2>
          <p className="my-3 text-sm text-charcoal-83">
            Các thao tác quản lý sẽ được mở cho Owner sau khi hệ thống duyệt hồ sơ công ty. Người
            nộp hồ sơ sẽ trở thành Owner.
          </p>
          <Link to="/recruiter/verification" className="recruiter-primary inline-flex">
            Xem hồ sơ xác thực
          </Link>
        </div>
      ) : !member ? (
        <div className="rounded-xl border border-warm-border bg-paper-white p-8">
          <h2 className="text-xl font-semibold">
            {invitation ? "Bạn được mời tham gia công ty" : "Bạn chưa là thành viên công ty"}
          </h2>
          <p className="my-3 text-sm text-charcoal-83">
            {invitation
              ? `Lời mời dành cho ${invitation.email}. Vai trò: recruiter.`
              : !user
                ? "Vui lòng đăng nhập để kiểm tra lời mời."
                : "Liên hệ Owner để được mời. Hồ sơ xác thực cũ chưa ghi nhận người nộp cần được hệ thống bổ sung trước khi cấp Owner."}
          </p>
          {invitation ? (
            <p className="text-sm leading-6 text-charcoal-83">
              Mở liên kết trong email mời để xác nhận lời mời với máy chủ.
            </p>
          ) : (
            !user && (
              <Link
                to="/login"
                search={{ role: "recruiter" }}
                className="recruiter-primary inline-flex"
              >
                Đăng nhập
              </Link>
            )
          )}
        </div>
      ) : (
        <>
          <div className="workspace-summary">
            {[
              ["Thành viên", activeMembers.length],
              ["Owner", activeMembers.filter((m) => m.role === "Owner").length],
            ].map(([label, count]) => (
              <div key={label} className="workspace-summary__item">
                <p className="text-sm text-charcoal-83">{label}</p>
                <p className="mt-2 text-3xl font-bold">{count}</p>
              </div>
            ))}
          </div>
          <ListSearch
            value={query}
            onChange={setQuery}
            label="Tìm tên, thư điện tử hoặc vai trò thành viên"
          />
          <div
            role="region"
            aria-label="Danh sách thành viên công ty"
            tabIndex={0}
            className="overflow-x-auto rounded-xl border border-warm-border bg-paper-white"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Thành viên", "Vai trò", "Trạng thái", "Thao tác"].map((t) => (
                    <th key={t} className="p-4">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!workspace.members.some(
                  (m) =>
                    (owner || m.status !== "removed") &&
                    matchesSearch(query, m.name, m.email, m.role),
                ) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-charcoal-83">
                      Không tìm thấy thành viên phù hợp.
                    </td>
                  </tr>
                )}
                {workspace.members
                  .filter(
                    (m) =>
                      (owner || m.status !== "removed") &&
                      matchesSearch(query, m.name, m.email, m.role),
                  )
                  .map((m) => (
                    <tr key={m.id} className="border-t border-warm-border">
                      <td className="p-4">
                        <p className="font-semibold">
                          {m.name}
                          {m.id === member.id ? " (Bạn)" : ""}
                        </p>
                        <p className="mt-1 text-sm text-charcoal-83">{m.email}</p>
                      </td>
                      <td className="p-4">
                        {m.status === "active" ? (
                          <select
                            disabled={!owner}
                            title={!owner ? "Chỉ Owner được đổi vai trò" : undefined}
                            aria-label={`Vai trò của ${m.email}`}
                            className="rounded-lg border border-warm-border bg-paper-white p-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={m.role}
                            onChange={(e) =>
                              run({
                                type: "role",
                                memberId: m.id,
                                role: e.target.value as "Owner" | "recruiter",
                              })
                            }
                          >
                            <option>Owner</option>
                            <option>recruiter</option>
                          </select>
                        ) : (
                          m.role
                        )}
                      </td>
                      <td className="p-4">
                        {m.status === "active"
                          ? "Đang hoạt động"
                          : m.status === "removed"
                            ? "Đã xóa"
                            : "Chờ chấp nhận"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-3">
                          {m.status !== "invited" &&
                            (owner ||
                              canViewMemberData(workspace, m.id, "jobs") ||
                              canViewMemberData(workspace, m.id, "applications")) && (
                              <button
                                className="flex items-center gap-1 font-semibold text-primary"
                                onClick={() => setSelectedId(m.id)}
                              >
                                <History size={16} />
                                Xem lịch sử
                              </button>
                            )}
                          {m.status === "active" && (
                            <button
                              disabled={!owner}
                              title={!owner ? "Chỉ Owner được phân quyền" : undefined}
                              className="font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => {
                                if (owner) setSelectedId(m.id);
                              }}
                            >
                              Phân quyền
                            </button>
                          )}
                          {m.status !== "removed" && (
                            <button
                              disabled={!owner}
                              title={
                                !owner
                                  ? "Chỉ Owner được xóa thành viên hoặc thu hồi lời mời"
                                  : undefined
                              }
                              className="text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => {
                                if (owner) setRemovingId(m.id);
                              }}
                            >
                              {m.status === "invited" ? "Thu hồi lời mời" : "Xóa thành viên"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-5 text-charcoal-83">
            Owner quản lý toàn bộ công ty. recruiter xem dữ liệu của mình và dữ liệu được Owner cấp
            quyền. Quyền xem tin và quyền xem đơn được cấp riêng theo từng người đăng. Công ty luôn
            phải có ít nhất một Owner.
          </p>
        </>
      )}
      <Dialog
        open={!!selected && !!member}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Lịch sử đăng tin và quyền xem dữ liệu của thành viên.
            </DialogDescription>
          </DialogHeader>
          {message && (
            <p role={failed ? "alert" : "status"} className="text-sm">
              {message}
            </p>
          )}
          {selected && (
            <>
              {selected.status === "active" && (
                <section>
                  <h3 className="mb-3 font-semibold">Cho phép {selected.name} xem dữ liệu của</h3>
                  {selected.role === "Owner" ? (
                    <p className="text-sm">Owner có quyền xem toàn bộ tin và đơn ứng tuyển.</p>
                  ) : (
                    activeMembers
                      .filter((m) => m.id !== selected.id)
                      .map((author) => {
                        const grant = workspace.grants.find(
                          (g) => g.viewerId === selected.id && g.authorId === author.id,
                        );
                        return (
                          <div
                            key={author.id}
                            className="mb-3 rounded-lg border border-warm-border p-3"
                          >
                            <p className="mb-2 text-sm font-semibold">{author.name}</p>
                            <div className="flex flex-wrap gap-4">
                              {(["jobs", "applications"] as const).map((kind) => (
                                <label key={kind} className="flex items-center gap-2 text-sm">
                                  <input
                                    disabled={!owner}
                                    title={!owner ? "Chỉ Owner được phân quyền" : undefined}
                                    type="checkbox"
                                    checked={grant?.[kind] ?? false}
                                    onChange={(e) =>
                                      run({
                                        type: "grant",
                                        grant: {
                                          viewerId: selected.id,
                                          authorId: author.id,
                                          jobs: grant?.jobs ?? false,
                                          applications: grant?.applications ?? false,
                                          [kind]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  {kind === "jobs" ? "Tin tuyển dụng" : "Đơn ứng tuyển"}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })
                  )}
                </section>
              )}
              <section>
                <h3 className="mb-3 font-semibold">Lịch sử đăng bài</h3>
                {canViewMemberData(workspace, selected.id, "jobs") ? (
                  workspace.jobs.filter((j) => j.authorId === selected.id).length ? (
                    workspace.jobs
                      .filter((j) => j.authorId === selected.id)
                      .map((j) => (
                        <div key={j.id} className="mb-2 rounded-lg border border-warm-border p-3">
                          <p className="font-medium">{j.title}</p>
                          <p className="mt-1 text-sm text-charcoal-83">
                            {new Date(j.created).toLocaleString("vi-VN")} · {j.status}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-charcoal-83">Thành viên chưa đăng tin nào.</p>
                  )
                ) : (
                  <p className="text-sm">Bạn chưa được cấp quyền xem tin.</p>
                )}
              </section>
              {canViewMemberData(workspace, selected.id, "applications") && (
                <Link to="/recruiter/applications" className="text-sm font-semibold text-primary">
                  Xem đơn ứng tuyển được cấp quyền →
                </Link>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing && owner}
        onOpenChange={(open) => {
          if (!open) setRemovingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removing?.status === "invited" ? "Thu hồi lời mời?" : "Xóa thành viên?"}
            </DialogTitle>
            <DialogDescription>
              {removing?.email} sẽ mất quyền truy cập công ty. Lịch sử đăng tin được giữ lại.
            </DialogDescription>
          </DialogHeader>
          {failed && (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRemovingId(null)}
              className="rounded-lg border border-warm-border px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              className="rounded-lg bg-red-700 px-4 py-2 text-white"
              onClick={() => {
                if (removing && run({ type: "remove", memberId: removing.id })) setRemovingId(null);
              }}
            >
              Xác nhận
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterShell>
  );
}
