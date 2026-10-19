import { createFileRoute } from "@tanstack/react-router";
import { LandingView } from "@/components/guardian/LandingView";

export const Route = createFileRoute("/vn")({
  head: () => ({
    meta: [
      { title: "GuardianWork — Việc làm đa ngành tại Việt Nam" },
      {
        name: "description",
        content:
          "Tìm việc làm đa ngành, khám phá doanh nghiệp và tham khảo thông tin về quyền lợi lao động trên GuardianWork.",
      },
    ],
  }),
  component: VnLandingPage,
});

function VnLandingPage() {
  return <LandingView />;
}
