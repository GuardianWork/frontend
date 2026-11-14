import { createFileRoute } from "@tanstack/react-router";
import { CompanyReviewView } from "@/components/guardian/CompanyReviewView";
import { publicSeo } from "@/lib/public-seo";

/**
 * Company reviewing page (UC-CAN company dossier): the full candidate-facing
 * read on a single company — identity, verification status, disclosed working
 * terms and the live roles that carry those facts.
 */
export const Route = createFileRoute("/companies/$companyId")({
  head: () => ({
    links: publicSeo("/companies").links,
    meta: [
      ...publicSeo("/companies").meta,
      { title: "Công ty — GuardianWork" },
      {
        name: "description",
        content:
          "Ngành nghề, địa điểm, mức lương, vị trí đang tuyển và nguồn thông tin của một công ty để ứng viên hiểu rõ trước khi ứng tuyển.",
      },
    ],
  }),
  component: CompanyReviewPage,
});

function CompanyReviewPage() {
  const { companyId } = Route.useParams();
  const id = Number(companyId);
  return <CompanyReviewView companyId={Number.isSafeInteger(id) && id > 0 ? id : 0} />;
}
