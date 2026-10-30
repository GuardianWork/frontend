import { createContext } from "react";
import type { EmployerOnboarding } from "@/services/employerOnboarding";

export const EmployerOnboardingContext = createContext<{
  onboarding: EmployerOnboarding;
  refresh: () => Promise<void>;
} | null>(null);
