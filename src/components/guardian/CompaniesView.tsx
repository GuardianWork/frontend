import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, Search, SearchX, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { paginateItems } from "@/lib/pagination";
import {
  searchPublicCompanies,
  type CompanySummary,
  type PublicCompanyDirectoryEntry,
} from "@/services/publicCompanies";
import { CompanyDetailLink } from "./CompanyLinks";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CompanyMark } from "./PublicJobsView";
import { CompanyIcon } from "../icons";

const COMPANIES_PER_PAGE = 15;

function countLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

const cityAliases: Record<string, string> = {
  "hà nội": "Hà Nội",
  "ha noi": "Hà Nội",
  hanoi: "Hà Nội",
  "hồ chí minh": "TP. Hồ Chí Minh",
  "ho chi minh": "TP. Hồ Chí Minh",
  "tp. hồ chí minh": "TP. Hồ Chí Minh",
  "tp hồ chí minh": "TP. Hồ Chí Minh",
  "tp. hcm": "TP. Hồ Chí Minh",
  "tp hcm": "TP. Hồ Chí Minh",
  "tp.hcm": "TP. Hồ Chí Minh",
  hcm: "TP. Hồ Chí Minh",
  hcmc: "TP. Hồ Chí Minh",
  "sài gòn": "TP. Hồ Chí Minh",
  "sai gon": "TP. Hồ Chí Minh",
  "đà nẵng": "Đà Nẵng",
  "da nang": "Đà Nẵng",
  "hải phòng": "Hải Phòng",
  "hai phong": "Hải Phòng",
  "cần thơ": "Cần Thơ",
  "can tho": "Cần Thơ",
  huế: "Huế",
  hue: "Huế",
  remote: "Remote",
  "toàn quốc": "Toàn quốc",
  "toan quoc": "Toàn quốc",
};

function cityLabel(location: string) {
  const city = location.split(/[,·–—]/)[0]?.trim() ?? "";
  if (!city) return location.trim();
  const cleaned = city
    .replace(/^(tp\.?|thành phố|tỉnh)\s+/i, "")
    .replace(/\s+city$/i, "")
    .trim();
  return cityAliases[cleaned.toLocaleLowerCase("vi")] ?? cleaned;
}

function cityLabels(locations: CompanySummary["locations"]) {
  const labels = new Set<string>();
  for (const location of locations) {
    labels.add(cityLabel(location.label));
  }
  return [...labels];
}

function CompanyCard({ entry }: { entry: PublicCompanyDirectoryEntry }) {
  const { dict } = useLanguage();
  const summary = entry.summary;
  const tags = summary.industries.slice(0, 4).map((item) => item.label);
  const locations = cityLabels(summary.locations);

  return (
    <CompanyDetailLink companyId={entry.id} className="company-card">
      <span className="company-card__top">
        <span className="company-card__mark">
          <CompanyIcon size={40} />
        </span>
        <span className="company-card__identity">
          <span className="company-card__name">{entry.name}</span>
          <span className="company-card__verified">
            <ShieldCheck size={13} aria-hidden="true" />
            {dict.companyReview.verified}
          </span>
        </span>
      </span>

      {tags.length ? (
        <span className="company-card__tags">
          {tags.map((tag) => (
            <span key={tag} className="company-card__tag">
              {tag}
            </span>
          ))}
        </span>
      ) : null}

      <span className="company-card__foot">
        {locations.length ? (
          <span className="company-card__location">
            {locations.map((location) => (
              <span key={location}>{location}</span>
            ))}
          </span>
        ) : null}
        {summary.roleCount > 0 ? (
          <span className="company-card__facts">
            {countLabel(dict.companyReview.openRolesCount, summary.roleCount)}
          </span>
        ) : (
          <span className="company-card__cta">
            {dict.companyReview.viewCompany}
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        )}
      </span>
    </CompanyDetailLink>
  );
}

function DirectorySkeleton() {
  return (
    <ul className="company-directory company-directory--loading" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="company-card-skeleton">
          <span className="company-card-skeleton__top" />
          <span className="company-card-skeleton__line" />
          <span className="company-card-skeleton__line company-card-skeleton__line--short" />
          <span className="company-card-skeleton__foot" />
        </li>
      ))}
    </ul>
  );
}

/**
 * The company directory: every company with a live public posting.
 *
 * A candidate arrives from the Candidate workspace or from any company title
 * and needs to understand the employer before opening a role. Each card answers
 * the same short set of questions: who they are, what they hire for, where and
 * what pay they disclose.
 */
export function CompaniesView({ workspace = false }: { workspace?: boolean }) {
  const { dict } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);
  useEffect(() => {
    setPage(0);
  }, [deferredQuery]);
  const companiesQuery = useQuery({
    queryKey: ["public-companies", deferredQuery.trim()],
    queryFn: () => searchPublicCompanies({ keyword: deferredQuery }),
    staleTime: 60_000,
  });

  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const totalRoles = companies.reduce((total, item) => total + item.summary.roleCount, 0);
  const pagination = paginateItems(companies, page, COMPANIES_PER_PAGE);

  return (
    <div
      className={`career-site guardian-company${workspace ? " guardian-company--workspace" : ""}`}
    >
      {!workspace ? (
        <>
          <a className="skip-link" href="#main-content">
            Đến nội dung chính
          </a>
          <Header variant="landing" />
        </>
      ) : null}

      <div id={workspace ? "company-content" : "main-content"}>
        <section className="company-index-hero">
          <div className="career-container">
            <div className="company-index-hero__intro">
              <h1>{dict.companyReview.directoryTitle}</h1>
              <p>{dict.companyReview.directoryIntro}</p>
            </div>

            <div className="company-index-hero__search">
              <Search size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="company-directory-search">
                {dict.companyReview.directorySearchLabel}
              </label>
              <input
                id="company-directory-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.companyReview.directorySearchPlaceholder}
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  className="company-index-hero__clear"
                  aria-label={dict.companyReview.directorySearchClear}
                  onClick={() => setQuery("")}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <p className="company-index-hero__count" role="status" aria-live="polite">
              {companiesQuery.isPending ? (
                <span>{dict.companyReview.directoryLoading}</span>
              ) : companiesQuery.isError ? (
                <span>{dict.companyReview.directoryError}</span>
              ) : (
                <>
                  <span>
                    {query.trim()
                      ? countLabel(dict.companyReview.directoryFilteredCount, companies.length)
                      : countLabel(dict.companyReview.directoryCount, companies.length)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{countLabel(dict.companyReview.directoryRoleCount, totalRoles)}</span>
                </>
              )}
            </p>
          </div>
        </section>

        <div className="career-container company-index-body">
          {companiesQuery.isPending ? (
            <DirectorySkeleton />
          ) : companiesQuery.isError ? (
            <div className="company-state company-state--error" role="alert">
              <BriefcaseBusiness size={32} aria-hidden="true" />
              <div>
                <h2>{dict.companyReview.directoryError}</h2>
                <button
                  type="button"
                  className="career-button career-button--outline"
                  onClick={() => void companiesQuery.refetch()}
                >
                  {dict.companyReview.retry}
                </button>
              </div>
            </div>
          ) : companies.length === 0 && query.trim() ? (
            <div className="career-empty company-empty company-empty--filter">
              <SearchX size={34} aria-hidden="true" />
              <h2>{dict.companyReview.directoryNoMatch}</h2>
              <p>{dict.companyReview.directoryNoMatchNote}</p>
              <button
                type="button"
                className="career-button career-button--outline"
                onClick={() => setQuery("")}
              >
                {dict.companyReview.directorySearchClear}
              </button>
            </div>
          ) : companies.length === 0 ? (
            <div className="career-empty">
              <BriefcaseBusiness size={36} aria-hidden="true" />
              <p>{dict.companyReview.emptyDirectory}</p>
            </div>
          ) : (
            <>
              <ul className="company-directory">
                {pagination.items.map((entry) => (
                  <li key={entry.id}>
                    <CompanyCard entry={entry} />
                  </li>
                ))}
              </ul>

              {pagination.totalPages > 1 && (
                <nav className="career-pagination" aria-label={dict.companyReview.paginationLabel}>
                  <button
                    type="button"
                    aria-label={dict.companyReview.paginationPrev}
                    disabled={pagination.page === 0}
                    onClick={() => setPage(pagination.page - 1)}
                  >
                    <span className="career-pagination__full">{dict.companyReview.paginationPrev}</span>
                    <span className="career-pagination__short" aria-hidden="true">
                      {dict.companyReview.paginationPrevShort}
                    </span>
                  </button>
                  <div className="career-pagination__pages">
                    {Array.from({ length: pagination.totalPages }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-current={pagination.page === index ? "page" : undefined}
                        aria-label={dict.companyReview.paginationPage.replace(
                          "{page}",
                          String(index + 1),
                        )}
                        onClick={() => setPage(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label={dict.companyReview.paginationNext}
                    disabled={pagination.page >= pagination.totalPages - 1}
                    onClick={() => setPage(pagination.page + 1)}
                  >
                    <span className="career-pagination__full">{dict.companyReview.paginationNext}</span>
                    <span className="career-pagination__short" aria-hidden="true">
                      {dict.companyReview.paginationNextShort}
                    </span>
                  </button>
                </nav>
              )}
            </>
          )}

          <p className="career-demo-note">{dict.companyReview.sourceNote}</p>
        </div>
      </div>

      {!workspace ? <Footer /> : null}
    </div>
  );
}
