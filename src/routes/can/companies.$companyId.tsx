import { createFileRoute } from "@tanstack/react-router";
import { CompanyReviewView } from "@/components/guardian/CompanyReviewView";
import { parseCompanyTabSearch } from "@/lib/company-tabs";

/** Company reviewing page inside the Candidate workspace. */
export const Route = createFileRoute("/can/companies/$companyId")({
  validateSearch: parseCompanyTabSearch,
  head: () => ({
    meta: [
      { title: "Hồ sơ công ty — GuardianWork" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CandidateCompanyReviewPage,
});

function CandidateCompanyReviewPage() {
  const { companyId } = Route.useParams();
  const { tab } = Route.useSearch();
  const id = Number(companyId);
  return (
    <CompanyReviewView
      companyId={Number.isSafeInteger(id) && id > 0 ? id : 0}
      tab={tab}
      workspace
    />
  );
}
