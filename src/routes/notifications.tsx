import { createFileRoute, redirect } from "@tanstack/react-router";
import { NotificationPage } from "@/components/candidate/NotificationPage";
import { hasAuthSession } from "@/services/auth";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    if (!hasAuthSession()) {
      // redirect unauthenticated users to login
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: NotificationPage,
});
