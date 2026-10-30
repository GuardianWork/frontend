import { useState, type ReactNode } from "react";
import { loadEmployerOnboarding, type EmployerOnboarding } from "@/services/employerOnboarding";
import { loadCurrentUser } from "@/services/auth";

import { EmployerOnboardingContext as Context } from "./employer-onboarding-state";

export function EmployerOnboardingProvider({
  initial,
  children,
}: {
  initial: EmployerOnboarding;
  children: ReactNode;
}) {
  const [onboarding, setOnboarding] = useState(initial);
  async function refresh() {
    await loadCurrentUser();
    const next = await loadEmployerOnboarding();
    setOnboarding(next);
  }
  return <Context.Provider value={{ onboarding, refresh }}>{children}</Context.Provider>;
}
