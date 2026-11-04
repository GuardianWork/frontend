import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsView } from "@/components/candidate/ApplicationsView";

export const Route = createFileRoute("/can/applications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Công việc đã ứng tuyển — GuardianWork" },
      {
        name: "description",
        content:
          "Theo dõi các tin tuyển dụng bạn đã nộp hồ sơ, hồ sơ đã đính kèm và trạng thái xử lý hiện tại.",
      },
    ],
  }),
  component: ApplicationsView,
});
