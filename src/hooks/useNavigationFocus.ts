import { useEffect } from "react";

/** Keep the existing mobile disclosure keyboard-safe without changing its destinations. */
export function useNavigationFocus(open: boolean, id: string) {
  useEffect(() => {
    if (!open) return;
    const panel = document.getElementById(id);
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const content = panel.parentElement?.querySelector<HTMLElement>(".workspace-content");
    const wasInert = content?.inert ?? false;
    if (content) content.inert = true;
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || !panel.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panel.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", trap);
    return () => {
      panel.removeEventListener("keydown", trap);
      if (content) content.inert = wasInert;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, id]);
}
