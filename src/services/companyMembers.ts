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
  moderationStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  companyName?: string;
  companyTaxCode?: string;
  visibility?: "PUBLIC" | "HIDDEN";
  visibilityReason?: string;
  visibilityUpdatedAt?: string;
  visibilityUpdatedBy?: string;
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

function persist(workspace: CompanyWorkspace, key = storageKey()) {
  try {
    localStorage.setItem(key, JSON.stringify(workspace));
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

export function createCompanyJob(
  input: Pick<CompanyJob, "title" | "department" | "location" | "salary" | "status">,
) {
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
    moderationStatus: "pending",
    companyName: getStoredVerificationRecord().name,
    companyTaxCode: getStoredVerificationRecord().taxCode,
  });
  return persist(workspace);
}

/** Existing published postings retain their visibility; only new submissions require review. */
export function jobModerationStatus(job: CompanyJob) {
  return job.moderationStatus ?? "approved";
}

export interface JobApproval extends CompanyJob {
  workspaceKey: string;
  authorName: string;
}

/** Admin sees submissions across the company workspaces stored in this browser. */
export function getJobApprovalQueue(): JobApproval[] {
  if (getCurrentUser()?.role !== "ADMIN")
    throw new Error("Chỉ quản trị viên được xem danh sách phê duyệt.");
  const jobs: JobApproval[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith("guardianwork_company_members_")) continue;
    const workspace: CompanyWorkspace = JSON.parse(localStorage.getItem(key) || "null");
    if (!workspace || !Array.isArray(workspace.jobs) || !Array.isArray(workspace.members))
      throw new Error(
        "Không đọc được dữ liệu tuyển dụng trên trình duyệt. Vui lòng kiểm tra dữ liệu và tải lại.",
      );
    jobs.push(
      ...workspace.jobs
        .filter((job) => job.status === "Active")
        .map((job) => ({
          ...job,
          workspaceKey: key,
          authorName:
            workspace.members.find((member) => member.id === job.authorId)?.name || "Chưa cung cấp",
        })),
    );
  }
  return jobs.sort((a, b) => b.created.localeCompare(a.created));
}

export function setCompanyJobVisibility(
  id: string,
  visibility: "PUBLIC" | "HIDDEN",
  reason: string,
  workspaceKey: string,
) {
  const user = getCurrentUser();
  if (user?.role !== "ADMIN") throw new Error("Chỉ quản trị viên được kiểm soát hiển thị tin.");
  if (!workspaceKey.startsWith("guardianwork_company_members_"))
    throw new Error("Workspace không hợp lệ.");
  if (reason.trim().length < 10 || reason.trim().length > 1000)
    throw new Error("Lý do phải dài từ 10 đến 1.000 ký tự.");
  const workspace: CompanyWorkspace = JSON.parse(localStorage.getItem(workspaceKey) || "null");
  const job = workspace?.jobs?.find((item) => item.id === id);
  if (!job || job.status !== "Active" || jobModerationStatus(job) !== "approved")
    throw new Error("Chỉ thay đổi hiển thị của tin đã duyệt và đang hoạt động. Vui lòng tải lại.");
  if ((job.visibility ?? "PUBLIC") === visibility)
    throw new Error("Trạng thái hiển thị đã thay đổi. Vui lòng tải lại danh sách.");
  job.visibility = visibility;
  job.visibilityReason = reason.trim();
  job.visibilityUpdatedAt = new Date().toISOString();
  job.visibilityUpdatedBy = user.email;
  return persist(workspace, workspaceKey);
}

export function reviewCompanyJob(
  id: string,
  decision: "approved" | "rejected",
  reason = "",
  workspaceKey = storageKey(),
) {
  const user = getCurrentUser();
  if (user?.role !== "ADMIN") throw new Error("Chỉ quản trị viên được phê duyệt tin tuyển dụng.");
  if (!workspaceKey.startsWith("guardianwork_company_members_"))
    throw new Error("Workspace không hợp lệ.");
  const workspace: CompanyWorkspace = JSON.parse(localStorage.getItem(workspaceKey) || "null");
  if (!workspace || !Array.isArray(workspace.jobs))
    throw new Error("Không đọc được workspace. Vui lòng tải lại.");
  const job = workspace.jobs.find((item) => item.id === id);
  if (!job || job.status !== "Active")
    throw new Error("Tin không còn chờ duyệt. Vui lòng tải lại danh sách.");
  if (jobModerationStatus(job) !== "pending")
    throw new Error("Tin đã được xử lý. Vui lòng tải lại danh sách.");
  if (decision === "rejected" && (reason.trim().length < 10 || reason.trim().length > 1000))
    throw new Error("Lý do từ chối phải dài từ 10 đến 1.000 ký tự.");
  job.moderationStatus = decision;
  job.rejectionReason = decision === "rejected" ? reason.trim() : undefined;
  job.reviewedAt = new Date().toISOString();
  job.reviewedBy = user.email;
  try {
    localStorage.setItem(workspaceKey, JSON.stringify(workspace));
  } catch {
    throw new Error("Không thể lưu quyết định. Vui lòng kiểm tra bộ nhớ trình duyệt và thử lại.");
  }
  window.dispatchEvent(new Event(COMPANY_WORKSPACE_EVENT));
  return workspace;
}

/** Browser-local application flow, shared with the candidate job page. */
export function submitCompanyApplication(jobId: string) {
  if (getStoredVerificationRecord().verificationStatus !== "VERIFIED")
    throw new Error("Công ty chưa được xác thực.");
  const user = getCurrentUser();
  if (!user) throw new Error("Vui lòng đăng nhập trước khi ứng tuyển.");
  const workspace = getCompanyWorkspace();
  const job = workspace.jobs.find(
    (j) =>
      j.id === jobId &&
      j.status === "Active" &&
      jobModerationStatus(j) === "approved" &&
      j.visibility !== "HIDDEN",
  );
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
