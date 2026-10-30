import { createFileRoute } from "@tanstack/react-router";
import { CvManagerView } from "@/components/candidate/CvManagerView";

export const Route = createFileRoute("/candidate/cvs")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Quản lý hồ sơ xin việc — GuardianWork" },
      {
        name: "description",
        content:
          "Tải lên, đặt mặc định, đổi tên và xóa hồ sơ xin việc dùng khi ứng tuyển trên GuardianWork.",
      },
    ],
  }),
  component: CvManagerView,
});
