import { captureInvitationLink } from "./services/invitationLink";
import { captureMemberEmailSecret, captureLegacyRegistrationLink } from "./lib/member-email-secret";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // The dedicated recipient page owns its memory-only credential. Legacy setup
  // capture must not consume it first or route the visitor away from that page.
  if (typeof window !== "undefined" && window.location.pathname === "/company-invitations")
    captureInvitationLink();
  else captureMemberEmailSecret();
  captureLegacyRegistrationLink();
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
