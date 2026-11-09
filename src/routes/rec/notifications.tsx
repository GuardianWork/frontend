import { createFileRoute } from "@tanstack/react-router";
import { NotificationPage } from "@/components/notifications/NotificationPage";

export const Route = createFileRoute("/rec/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Thông báo — GuardianWork" },
      {
        name: "description",
        content: "Xem thông báo về tin tuyển dụng, đơn ứng tuyển và hoạt động công ty.",
      },
    ],
  }),
  component: NotificationPage,
});
