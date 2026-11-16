import { publicSeo } from "@/lib/public-seo";
import { createFileRoute } from "@tanstack/react-router";
import { CompaniesView } from "@/components/guardian/CompaniesView";

/**
 * Public company discovery for candidates: the companies worth understanding
 * before applying, each linking into its full review dossier.
 */
export const Route = createFileRoute("/companies/")({
  head: () => ({
    links: publicSeo("/companies").links,
    meta: [
      ...publicSeo("/companies").meta,
      { title: "Công ty đang tuyển dụng — GuardianWork" },
      {
        name: "description",
        content:
          "Khám phá các công ty đang tuyển dụng tại Việt Nam và hiểu rõ hơn về ngành nghề, địa điểm, mức lương và vị trí trước khi ứng tuyển.",
      },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  return <CompaniesView />;
}
