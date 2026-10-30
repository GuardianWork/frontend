import { createContext, useContext, useState, type ReactNode } from "react";
import { loadEmployerOnboarding, type EmployerOnboarding } from "@/services/employerOnboarding";
import { loadCurrentUser } from "@/services/auth";

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
    await loadCurrentUser();
    const next = await loadEmployerOnboarding();
    setOnboarding(next);
  }
  return <Context.Provider value={{ onboarding, refresh }}>{children}</Context.Provider>;
}
export function useEmployerOnboarding() {
  return useContext(Context);
}
