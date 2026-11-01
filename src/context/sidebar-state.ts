import { createContext } from "react";
export const SidebarState = createContext({
  collapsed: false,
  animate: false,
  toggle: () => {},
  enabled: false,
});
export const SIDEBAR_PREFERENCE_KEY = "guardianwork_sidebar_collapsed";
