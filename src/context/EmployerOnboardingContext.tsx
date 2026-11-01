import { useCallback, useRef, useState, type ReactNode } from "react";
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
  const pendingRefresh = useRef<Promise<void> | null>(null);
  const refresh = useCallback(() => {
    if (pendingRefresh.current) return pendingRefresh.current;
    pendingRefresh.current = (async () => {
      await loadCurrentUser();
      const next = await loadEmployerOnboarding();
      setOnboarding(next);
    })().finally(() => {
      pendingRefresh.current = null;
    });
    return pendingRefresh.current;
  }, []);
  return <Context.Provider value={{ onboarding, refresh }}>{children}</Context.Provider>;
}
