import { createFileRoute } from "@tanstack/react-router";
import { MyJobsView } from "@/components/candidate/MyJobsView";

export const Route = createFileRoute("/can/applied")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Công việc của tôi — GuardianWork" },
      {
        name: "description",
        content:
          "Theo dõi các tin tuyển dụng bạn đã nộp hồ sơ, hồ sơ đã đính kèm và trạng thái xử lý hiện tại.",
      },
    ],
  }),
  component: MyJobsView,
});
