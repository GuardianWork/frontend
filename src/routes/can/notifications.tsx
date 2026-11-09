import { createFileRoute } from "@tanstack/react-router";
import { NotificationPage } from "@/components/notifications/NotificationPage";

export const Route = createFileRoute("/can/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Thông báo — GuardianWork" },
      {
        name: "description",
        content:
          "Xem tất cả thông báo về tin tuyển dụng, hoạt động tài khoản và cập nhật từ GuardianWork.",
      },
    ],
  }),
  component: NotificationPage,
});
