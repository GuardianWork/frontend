import { createFileRoute } from "@tanstack/react-router";
import { CompaniesView } from "@/components/guardian/CompaniesView";

/** Company discovery inside the Candidate workspace. */
export const Route = createFileRoute("/can/companies/")({
  head: () => ({
    meta: [{ title: "Công ty — GuardianWork" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: CandidateCompaniesPage,
});

function CandidateCompaniesPage() {
  return <CompaniesView workspace />;
}
