import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/account/AccountPage";
export const Route = createFileRoute("/rec/account")({
  head: () => ({
    meta: [
      { title: "Cài đặt tài khoản — GuardianWork" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <AccountPage role="recruiter" />,
});
