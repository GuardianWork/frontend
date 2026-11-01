import { createContext, useContext } from "react";

/** A nested page contributes content to the existing workspace frame. */
export const WorkspaceLayoutContext = createContext<"candidate" | "recruiter" | null>(null);
export function useWorkspaceLayout() {
  return useContext(WorkspaceLayoutContext);
}
