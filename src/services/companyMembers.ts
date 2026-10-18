import { getStoredVerificationRecord } from "./companyVerification.ts";
import { getCurrentUser } from "./auth.ts";
export { getCurrentUser } from "./auth.ts";

export type CompanyRole = "Owner" | "recruiter";
export interface CompanyMember {
  id: string;
  userId?: number;
  name: string;
  email: string;
  role: CompanyRole;
  status: "active" | "invited" | "removed";
  joinedAt: string;
}
export interface MemberGrant {
  viewerId: string;
  authorId: string;
  jobs: boolean;
  applications: boolean;
}
export interface CompanyJob {
  id: string;
  authorId: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  status: "Active" | "Draft" | "Closed";
  created: string;
}
export interface CompanyApplication {
  id: string;
  jobId: string;
  name: string;
  email: string;
  submittedAt: string;
}
export interface CompanyWorkspace {
  members: CompanyMember[];
  grants: MemberGrant[];
  jobs: CompanyJob[];
  applications: CompanyApplication[];
}
export const COMPANY_WORKSPACE_EVENT = "guardianwork-company-workspace";

function storageKey() {
  const company = getStoredVerificationRecord();
  return `guardianwork_company_members_${company.id}_${company.taxCode}`;
}

export function getCompanyWorkspace(): CompanyWorkspace {
  const empty: CompanyWorkspace = { members: [], grants: [], jobs: [], applications: [] };
  if (typeof window === "undefined") return empty;
  const company = getStoredVerificationRecord();
  if (company.verificationStatus !== "VERIFIED") return empty;
  const raw = localStorage.getItem(storageKey());
  if (raw) return JSON.parse(raw);
  const submitter = company.submittedBy;
  if (!submitter) return empty;
  return {
    ...empty,
    members: [
      {
        id: `user-${submitter.id}`,
        userId: submitter.id,
        name: `${submitter.firstName} ${submitter.lastName}`.trim() || submitter.email,
        email: submitter.email.toLowerCase(),
        role: "Owner",
        status: "active",
        joinedAt: company.verifiedAt || company.updatedAt,
      },
    ],
  };
}

export function currentMember(workspace: CompanyWorkspace): CompanyMember | undefined {
  const user = getCurrentUser();
  return workspace.members.find((m) => m.status === "active" && m.userId === user?.id);
}

export function canViewMemberData(
  workspace: CompanyWorkspace,
  authorId: string,
  kind: "jobs" | "applications",
) {
  const member = currentMember(workspace);
  if (getStoredVerificationRecord().verificationStatus !== "VERIFIED" || !member) return false;
  return (
    member.role === "Owner" ||
    member.id === authorId ||
    workspace.grants.some((g) => g.viewerId === member.id && g.authorId === authorId && g[kind])
  );
}

function persist(workspace: CompanyWorkspace) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(workspace));
  } catch {
    throw new Error("Không thể lưu thay đổi. Vui lòng kiểm tra bộ nhớ trình duyệt.");
  }
  window.dispatchEvent(new Event(COMPANY_WORKSPACE_EVENT));
  return workspace;
}

export type MemberAction =
  | { type: "invite"; email: string }
  | { type: "accept" }
  | { type: "remove"; memberId: string }
  | { type: "role"; memberId: string; role: CompanyRole }
  | { type: "grant"; grant: MemberGrant };

export function updateCompanyMembers(action: MemberAction): CompanyWorkspace {
  if (getStoredVerificationRecord().verificationStatus !== "VERIFIED")
    throw new Error("Công ty chưa được xác thực.");
  const workspace = getCompanyWorkspace();
  const user = getCurrentUser();
  if (!user) throw new Error("Vui lòng đăng nhập để tiếp tục.");
  if (action.type === "accept") {
    const invitation = workspace.members.find(
      (m) => m.status === "invited" && m.email === user.email.toLowerCase(),
    );
    if (!invitation || currentMember(workspace))
      throw new Error("Không có lời mời hợp lệ cho tài khoản này.");
    invitation.status = "active";
    invitation.userId = user.id;
    invitation.name = `${user.firstName} ${user.lastName}`.trim() || user.email;
    invitation.joinedAt = new Date().toISOString();
    return persist(workspace);
  }
  const actor = currentMember(workspace);
  if (actor?.role !== "Owner") throw new Error("Chỉ Owner được quản lý thành viên.");
  if (action.type === "invite") {
    const email = action.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email không hợp lệ.");
    if (workspace.members.some((m) => m.email === email && m.status !== "removed"))
      throw new Error("Email đã là thành viên hoặc đang có lời mời.");
    workspace.members.push({
      id: crypto.randomUUID(),
      name: email,
      email,
      role: "recruiter",
      status: "invited",
      joinedAt: new Date().toISOString(),
    });
  } else if (action.type === "grant") {
    const { viewerId, authorId, jobs, applications } = action.grant;
    if (
      viewerId === authorId ||
      ![viewerId, authorId].every((id) =>
        workspace.members.some((m) => m.id === id && m.status === "active"),
      )
    )
      throw new Error("Thành viên không hợp lệ.");
    workspace.grants = workspace.grants.filter(
      (g) => g.viewerId !== viewerId || g.authorId !== authorId,
    );
    workspace.grants.push({ viewerId, authorId, jobs, applications });
  } else {
    const target = workspace.members.find(
      (m) => m.id === action.memberId && m.status !== "removed",
    );
    if (!target) throw new Error("Không tìm thấy thành viên.");
    if (
      target.role === "Owner" &&
      workspace.members.filter((m) => m.status === "active" && m.role === "Owner").length === 1 &&
      (action.type === "remove" || action.role !== "Owner")
    )
      throw new Error("Công ty phải có ít nhất một Owner.");
    if (action.type === "remove") {
      target.status = "removed";
      workspace.grants = workspace.grants.filter(
        (g) => g.viewerId !== target.id && g.authorId !== target.id,
      );
    } else {
      if (target.status !== "active")
        throw new Error("Chỉ đổi vai trò sau khi thành viên nhận lời mời.");
      target.role = action.role;
    }
  }
  return persist(workspace);
}

export function createCompanyJob(input: Omit<CompanyJob, "id" | "authorId" | "created">) {
  const workspace = getCompanyWorkspace();
  const member = currentMember(workspace);
  if (!member || getStoredVerificationRecord().verificationStatus !== "VERIFIED")
    throw new Error("Bạn cần là thành viên của công ty đã xác thực để đăng tin.");
  if (!input.title.trim()) throw new Error("Vui lòng nhập chức danh.");
  workspace.jobs.unshift({
    ...input,
    title: input.title.trim(),
    id: crypto.randomUUID(),
    authorId: member.id,
    created: new Date().toISOString(),
  });
  return persist(workspace);
}

/** Browser-local application flow, shared with the candidate job page. */
export function submitCompanyApplication(jobId: string) {
  if (getStoredVerificationRecord().verificationStatus !== "VERIFIED")
    throw new Error("Công ty chưa được xác thực.");
  const user = getCurrentUser();
  if (!user) throw new Error("Vui lòng đăng nhập trước khi ứng tuyển.");
  const workspace = getCompanyWorkspace();
  const job = workspace.jobs.find((j) => j.id === jobId && j.status === "Active");
  if (!job) throw new Error("Tin tuyển dụng không còn nhận đơn.");
  if (workspace.applications.some((a) => a.jobId === jobId && a.email === user.email.toLowerCase()))
    throw new Error("Bạn đã ứng tuyển tin này.");
  workspace.applications.push({
    id: crypto.randomUUID(),
    jobId,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    email: user.email.toLowerCase(),
    submittedAt: new Date().toISOString(),
  });
  return persist(workspace);
}
