import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { NotificationPage } from "@/components/notifications/NotificationPage";

export const Route = createFileRoute("/staff/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Thông báo — GuardianWork" },
      {
        name: "description",
        content: "Xem thông báo về hồ sơ xác minh, báo cáo vi phạm và hoạt động hệ thống.",
      },
    ],
  }),
  component: StaffNotificationsPage,
});

function StaffNotificationsPage() {
  return (
    <AdminShell title="Thông báo" role="admin">
      <NotificationPage />
    </AdminShell>
  );
}
