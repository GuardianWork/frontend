import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useEmployerOnboarding } from "@/hooks/useEmployerOnboarding";
import { EmployerOnboardingPanel } from "@/components/EmployerOnboardingPanel";

/** Company gates change only the main content; account settings are independent. */
export function RecruiterAccess({ children }: { children: ReactNode }) {
  const context = useEmployerOnboarding();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const stage = context?.onboarding.stage;
  const companyPage = pathname === "/rec/verification";
  const invitationsPage = pathname === "/rec/members";
  const allowed =
    pathname === "/rec/account" ||
    (stage === "VERIFIED" && !context?.onboarding.companySuspended) ||
    (context?.onboarding.companySuspended && companyPage) ||
    (stage === "COMPANY_ACTION_REQUIRED" && (companyPage || invitationsPage)) ||
    ((stage === "PENDING" || stage === "REJECTED") && companyPage);
  return allowed ? children : <EmployerOnboardingPanel />;
}
