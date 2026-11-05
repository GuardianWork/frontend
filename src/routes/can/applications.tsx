import { createFileRoute, redirect } from "@tanstack/react-router";

/** The applied-jobs ledger moved under the "Công việc của tôi" collection page. */
export const Route = createFileRoute("/can/applications")({
  beforeLoad: () => {
    throw redirect({ href: "/can/applied", replace: true });
  },
});
