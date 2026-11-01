import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarState, SIDEBAR_PREFERENCE_KEY } from "./sidebar-state";

/** Only a display preference is stored; credentials retain the sessionStorage strategy. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1101px)");
    const update = () => {
      setDesktop(media.matches);
      setAnimate(false);
    };
    update();
    media.addEventListener("change", update);
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === "true");
    } catch {
      /* Storage may be unavailable. */
    }
    return () => media.removeEventListener("change", update);
  }, []);
  const toggle = useCallback(() => {
    setAnimate(true);
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(next));
      } catch {
        /* In-memory mode still works. */
      }
      return next;
    });
  }, []);
  const value = useMemo(
    () => ({ collapsed: desktop && collapsed, animate, toggle, enabled: true }),
    [desktop, collapsed, animate, toggle],
  );
  return (
    <SidebarState.Provider value={value}>
      <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
    </SidebarState.Provider>
  );
}
