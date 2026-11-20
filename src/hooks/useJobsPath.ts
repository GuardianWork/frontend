import { useRouterState } from "@tanstack/react-router";

export function useJobsPath() {
  return useRouterState({
    select: (state) =>
      state.location.pathname.startsWith("/can/") ? ("/can/jobs" as const) : ("/jobs" as const),
  });
}
