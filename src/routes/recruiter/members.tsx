import { ListSearch } from "@/components/ListSearch";
import { matchesSearch } from "@/lib/list-search";
import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/recruiter/members")({
  head: () => ({ meta: [{ title: "Thành viên công ty — GuardianWork" }] }),
  component: CompanyMembersPage,
});

function CompanyMembersPage() {
  const { workspace, company, member, user, error } = useCompanyWorkspace();
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
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
      setMessage(
        action.type === "invite"
          ? "Đã tạo lời mời. Thành viên đăng nhập bằng email này và mở trang Thành viên công ty để nhận lời mời trên trình duyệt hiện tại."
          : "Đã lưu thay đổi.",
      );
      if (action.type === "invite") setEmail("");
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
          if (owner) run({ type: "invite", email });
        }}
        className="mb-6 rounded-xl border border-warm-border bg-paper-white p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UserPlus size={19} />
          Mời thành viên
        </h2>
        <div className="flex flex-wrap gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Email thành viên</span>
            <input
              disabled={!owner}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email tài khoản nhà tuyển dụng"
              className="w-full rounded-lg border border-warm-border bg-surface-container-low px-3 py-2 text-sm"
            />
          </label>
          <button
            className="recruiter-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!owner}
            title={!owner ? "Chỉ Owner được mời thành viên" : undefined}
          >
            Tạo lời mời
          </button>
        </div>
        <p className="mt-3 text-xs text-charcoal-83">
          Thành viên mới có vai trò recruiter. Lời mời hiện lưu trên trình duyệt, chưa gửi qua
          email.
        </p>
      </form>
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
            <button className="recruiter-primary" onClick={() => run({ type: "accept" })}>
              Chấp nhận lời mời
            </button>
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
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Thành viên", activeMembers.length],
              ["Owner", activeMembers.filter((m) => m.role === "Owner").length],
              ["Lời mời đang chờ", workspace.members.filter((m) => m.status === "invited").length],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl border border-warm-border bg-paper-white p-5">
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
          <div className="overflow-x-auto rounded-xl border border-warm-border bg-paper-white">
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
                        <p className="mt-1 text-xs text-charcoal-83">{m.email}</p>
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
          <p className="mt-4 text-xs leading-5 text-charcoal-83">
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
                          <p className="mt-1 text-xs text-charcoal-83">
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
