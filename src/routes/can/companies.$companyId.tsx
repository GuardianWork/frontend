import { createFileRoute } from "@tanstack/react-router";
import { CompanyReviewView } from "@/components/guardian/CompanyReviewView";

/** Company reviewing page inside the Candidate workspace. */
export const Route = createFileRoute("/can/companies/$companyId")({
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
  const id = Number(companyId);
  return <CompanyReviewView companyId={Number.isSafeInteger(id) && id > 0 ? id : 0} workspace />;
}
