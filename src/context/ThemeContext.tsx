import { useEffect, type ReactNode } from "react";

/** Guardian Blue is the product's single theme. Clear legacy theme preferences. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "guardian-blue");
    document.body.setAttribute("data-theme", "guardian-blue");
    document.documentElement.classList.remove("dark");
    try {
      localStorage.removeItem("guardian-theme");
    } catch {
      // The fixed theme also works when browser storage is unavailable.
    }
  }, []);

  return <>{children}</>;
}
