import type { ActiveMembership, AuthUser } from "@/services/auth";

const ROLE_LABELS = {
  OWNER: { vi: "chủ sở hữu", en: "the owner" },
  ADMIN: { vi: "quản trị viên", en: "an admin" },
  RECRUITER: { vi: "nhà tuyển dụng", en: "a recruiter" },
} as const;

/**
 * The viewer's active company membership when the posting belongs to that company.
 *
 * Mirrors the backend rule in JobApplicationService.submit: any active membership
 * at the posting's company blocks an application, regardless of company role.
 */
export function selfCompanyMembership(
  user: Pick<AuthUser, "activeMembership"> | null | undefined,
  companyId: number | undefined,
): ActiveMembership | null {
  const membership = user?.activeMembership;
  if (!membership || typeof companyId !== "number") return null;
  return membership.companyId === companyId ? membership : null;
}

/** Human role name for the explanatory copy, e.g. "chủ sở hữu" / "the owner". */
export function companyRoleLabel(role: string | undefined, en: boolean): string {
  const key = role && Object.hasOwn(ROLE_LABELS, role) ? (role as keyof typeof ROLE_LABELS) : null;
  if (!key) return en ? "a company member" : "thành viên công ty";
  return ROLE_LABELS[key][en ? "en" : "vi"];
}
