import { createFileRoute } from "@tanstack/react-router";
import { MyJobsView } from "@/components/candidate/MyJobsView";

/** One application to open; set by application notifications. */
interface AppliedSearch {
  application?: string;
}

/** Only a single, bounded application id is honoured; anything else is dropped. */
function parseAppliedSearch(search: Record<string, unknown>): AppliedSearch {
  const raw = typeof search.application === "string" ? search.application.trim() : "";
  return raw ? { application: raw.slice(0, 100) } : {};
}

export const Route = createFileRoute("/can/applied")({
  validateSearch: parseAppliedSearch,
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
  component: AppliedPage,
});

function AppliedPage() {
  const { application } = Route.useSearch();
  return <MyJobsView focusApplicationId={application} />;
}
