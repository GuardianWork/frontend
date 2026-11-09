import type { useNavigate } from "@tanstack/react-router";
import type { NotificationPath } from "@/services/notifications";

/** Run a resolved {@link NotificationPath} against the router's typed navigate. */
export function navigateToPath(
  path: NotificationPath,
  navigate: ReturnType<typeof useNavigate>,
): void {
  switch (path.to) {
    case "/jobs":
      void navigate({ to: "/jobs", search: path.search });
      return;
    case "/rec/jobs":
      void navigate({ to: "/rec/jobs", search: path.search });
      return;
    case "/can/applied":
      void navigate({ to: "/can/applied" });
      return;
    case "/rec/applications":
      void navigate({ to: "/rec/applications" });
      return;
    case "/rec/applications/$jobId/$applicationId":
      void navigate({
        to: "/rec/applications/$jobId/$applicationId",
        params: path.params,
      });
      return;
    case "/rec/members":
      void navigate({ to: "/rec/members" });
      return;
  }
}
