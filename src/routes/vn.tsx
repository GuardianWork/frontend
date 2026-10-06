import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/components/guardian/LandingView";

export const Route = createFileRoute("/vn")({
  head: () => ({
    meta: [
      { title: "GuardianWork — Nền tảng Việc làm IT Thẩm định Pháp lý Lao động Việt Nam" },
      {
        name: "description",
        content:
          "Thị trường việc làm IT Việt Nam kiểm toán pháp lý theo Bộ luật Lao động 2019: Điều 98 làm thêm giờ, Điều 25 thử việc minh bạch.",
      },
    ],
  }),
  component: VnLandingPage,
});

function VnLandingPage() {
  return <LandingView />;
}
