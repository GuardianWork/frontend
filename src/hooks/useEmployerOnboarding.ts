import { useContext } from "react";
import { EmployerOnboardingContext } from "@/context/employer-onboarding-state";

export function useEmployerOnboarding() {
  return useContext(EmployerOnboardingContext);
}
