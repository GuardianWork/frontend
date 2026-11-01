import { useContext, type ReactElement } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarState } from "@/context/sidebar-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarLabel({ label, children }: { label: string; children: ReactElement }) {
  const { collapsed, enabled } = useContext(SidebarState);
  if (!enabled) return children;
  return (
    <Tooltip open={collapsed ? undefined : false}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
export function SidebarCollapseButton({ controls }: { controls: string }) {
  const { collapsed, toggle, enabled } = useContext(SidebarState);
  if (!enabled) return null;
  const label = collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";
  return (
    <SidebarLabel label={label}>
      <button
        type="button"
        className="workspace-collapse-toggle"
        onClick={toggle}
        aria-label={label}
        aria-controls={controls}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} aria-hidden="true" />
        ) : (
          <PanelLeftClose size={18} aria-hidden="true" />
        )}
      </button>
    </SidebarLabel>
  );
}
