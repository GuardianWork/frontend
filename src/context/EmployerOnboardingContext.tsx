import { createContext, useContext, useState, type ReactNode } from "react";
import { loadEmployerOnboarding, type EmployerOnboarding } from "@/services/employerOnboarding";
import { loadCurrentUser } from "@/services/auth";
import { loadCompanyVerification } from "@/services/companyVerification";

const Context = createContext<{
  onboarding: EmployerOnboarding;
  refresh: () => Promise<void>;
} | null>(null);
export function EmployerOnboardingProvider({
  initial,
  children,
}: {
  initial: EmployerOnboarding;
  children: ReactNode;
}) {
  const [onboarding, setOnboarding] = useState(initial);
  async function refresh() {
    const next = await loadEmployerOnboarding();
    if (next.stage !== "VERIFIED") setOnboarding(next);
    const user = await loadCurrentUser();
    if (
      user.activeMembership &&
      (user.activeMembership.companyRole === "OWNER"
        ? next.stage !== "EMAIL_REQUIRED"
        : next.stage === "VERIFIED")
    )
      await loadCompanyVerification();
    setOnboarding(next);
  }
  return <Context.Provider value={{ onboarding, refresh }}>{children}</Context.Provider>;
}
export function useEmployerOnboarding() {
  return useContext(Context);
}
