import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";
export const Route = createFileRoute("/account")({
  beforeLoad: () => {
    throw redirect({
      to: getCurrentUser()?.activeMembership ? "/rec/account" : "/can/account",
      replace: true,
    });
  },
});
