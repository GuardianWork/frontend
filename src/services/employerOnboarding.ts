import { ApiError } from "./api.ts";
import { authenticatedRequest, getCurrentUser } from "./auth.ts";
import { loadCompanyVerification } from "./companyVerification.ts";

export type EmployerStage = "COMPANY_ACTION_REQUIRED" | "PENDING" | "REJECTED" | "VERIFIED";
export interface EmployerOnboarding {
  stage: EmployerStage;
}

/** Recruiter access follows the authenticated Company membership and verification APIs. */
export async function loadEmployerOnboarding(): Promise<EmployerOnboarding> {
  const user = getCurrentUser();
  if (!user) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
  if (!user.activeMembership) return { stage: "COMPANY_ACTION_REQUIRED" };

  if (user.activeMembership.companyRole !== "OWNER") {
    const company = (await authenticatedRequest("/companies/me")) as {
      companyId: number;
      companyRole: string;
    } | null;
    if (!company) return { stage: "COMPANY_ACTION_REQUIRED" };
    if (company.companyId !== user.activeMembership.companyId)
      throw new ApiError("Hồ sơ công ty không khớp với tài khoản hiện tại.");
    // Recruiters join verified companies through invitations; dossiers are owner-only.
    return { stage: "VERIFIED" };
  }

  const company = await loadCompanyVerification();
  return {
    stage:
      company.verificationStatus === "REGISTERED"
        ? "COMPANY_ACTION_REQUIRED"
        : company.verificationStatus,
  };
}
