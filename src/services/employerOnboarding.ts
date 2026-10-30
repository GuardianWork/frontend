import { ApiError } from "./api.ts";
import { getCurrentUser } from "./auth.ts";
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

  const company = await loadCompanyVerification();
  return {
    stage:
      company.verificationStatus === "REGISTERED"
        ? "COMPANY_ACTION_REQUIRED"
        : company.verificationStatus,
  };
}
