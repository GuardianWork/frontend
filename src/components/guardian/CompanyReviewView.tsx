import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Info,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import {
  compactSalary,
  findPublicCompany,
  readCompanySummary,
  type CompanyRole,
} from "@/services/publicCompanies";
import { mockCompanyProfile } from "@/lib/company-profile-mock";
import {
  DEFAULT_COMPANY_TAB,
  type CompanyTabId,
  type CompanyTabSelection,
} from "@/lib/company-tabs";
import { jobSearch } from "@/lib/job-search";
import { CompanyIndexLink } from "./CompanyLinks";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CompanyMark, useJobsPath } from "./PublicJobsView";
import { CompanyIcon } from "../icons";

function formatDate(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function listOrDash(values: string[], fallback: string) {
  return values.length ? values.join(" · ") : fallback;
}

function countLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="company-block__head">
      <h2 id={`${id}-title`}>{title}</h2>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

function RoleRow({
  role,
  jobsPath,
  dict,
}: {
  role: CompanyRole;
  jobsPath: "/jobs" | "/can/jobs";
  dict: ReturnType<typeof useLanguage>["dict"];
}) {
  const detailSearch = jobSearch({ job: String(role.id) });
  return (
    <li>
      <article className="company-role">
        <div className="company-role__main">
          <h3>
            <Link to={jobsPath} search={detailSearch}>
              {role.title}
            </Link>
          </h3>
          <p className="company-role__tags">
            <span>{role.employmentTypeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{role.workArrangementLabel}</span>
            {role.industry ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{role.industry}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="company-role__meta">
          <p>
            <MapPin size={15} aria-hidden="true" />
            <span>{role.location ?? dict.companyReview.locations}</span>
          </p>
          {role.headcount ? (
            <p>
              <Users size={15} aria-hidden="true" />
              <span>{countLabel(dict.companyReview.roleHeadcount, role.headcount)}</span>
            </p>
          ) : null}
        </div>
        <div className="company-role__pay">
          <p className="company-role__salary">
            <Banknote size={15} aria-hidden="true" />
            <span>{role.salary?.label ?? dict.companyReview.roleSalaryHidden}</span>
          </p>
          <p>
            <CalendarClock size={15} aria-hidden="true" />
            <span>
              {role.deadline
                ? dict.companyReview.roleDeadline.replace("{date}", formatDate(role.deadline))
                : dict.companyReview.roleNoDeadline}
            </span>
          </p>
        </div>
        <div className="company-role__actions">
          <Link
            to={jobsPath}
            search={detailSearch}
            className="career-button career-button--outline"
          >
            {dict.companyReview.viewRole}
          </Link>
          {role.applicationsAvailable ? (
            <Link to="/can/jobs/apply" search={{ job: String(role.id) }} className="career-button">
              {dict.companyReview.applyNow}
            </Link>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function DossierSkeleton({ label }: { label: string }) {
  return (
    <div className="company-dossier-loading" role="status">
      <span className="sr-only">{label}</span>
      <div className="company-dossier-skeleton" aria-hidden="true">
        <div className="company-dossier-skeleton__hero">
          <span className="company-skeleton-block company-skeleton-block--mark" />
          <div>
            <span className="company-skeleton-block company-skeleton-block--title" />
            <span className="company-skeleton-block company-skeleton-block--line" />
          </div>
        </div>
        <div className="company-dossier-skeleton__body">
          <div className="company-dossier-skeleton__main">
            <span className="company-skeleton-block company-skeleton-block--heading" />
            <span className="company-skeleton-block company-skeleton-block--line" />
            <span className="company-skeleton-block company-skeleton-block--line" />
            <span className="company-skeleton-block company-skeleton-block--line company-skeleton-block--short" />
          </div>
          <div className="company-dossier-skeleton__rail">
            <span className="company-skeleton-block company-skeleton-block--card" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The company reviewing page.
 *
 * A candidate arrives here from the company directory, the Candidate sidebar or
 * any company title and wants to understand the employer before applying. The
 * page reads only what the company published in its public postings, separates
 * what GuardianWork verified from what it aggregated, and names what is missing
 * instead of filling the gaps with invented facts.
 */
export function CompanyReviewView({
  companyId,
  tab,
  workspace = false,
}: {
  companyId: number;
  tab?: CompanyTabSelection;
  workspace?: boolean;
}) {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const jobsPath = useJobsPath();
  const companyQuery = useQuery({
    queryKey: ["public-company", companyId],
    queryFn: () => findPublicCompany(companyId),
    enabled: companyId > 0,
    staleTime: 60_000,
  });

  const company = companyQuery.data ?? null;
  const summary = useMemo(() => (company ? readCompanySummary(company) : null), [company]);
  const profile = useMemo(
    () => (company && summary ? mockCompanyProfile(company, summary) : null),
    [company, summary],
  );
  const activeTab = tab ?? DEFAULT_COMPANY_TAB;

  const tabs: { id: CompanyTabId; label: string; disabled?: boolean }[] = [
    { id: "gioi-thieu", label: dict.companyReview.tabOverview },
    { id: "viec-lam", label: dict.companyReview.tabJobs },
    { id: "danh-gia", label: dict.companyReview.tabReviews, disabled: true },
  ];

  const selectTab = (nextTab: CompanyTabId) => {
    if (nextTab === "danh-gia") return;
    void navigate({
      search: (previous) => ({
        ...previous,
        tab: nextTab === DEFAULT_COMPANY_TAB ? undefined : nextTab,
      }),
    });
  };

  if (companyId <= 0 || (!companyQuery.isPending && !companyQuery.isError && !company)) {
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
          <div className="career-container">
            <section className="career-empty company-empty">
              <ShieldCheck size={40} aria-hidden="true" />
              <h1>{dict.companyReview.notFound}</h1>
              <p>{dict.companyReview.notFoundNote}</p>
              <CompanyIndexLink className="career-button">
                {dict.companyReview.notFoundAction}
              </CompanyIndexLink>
            </section>
          </div>
        </div>
        {!workspace ? <Footer /> : null}
      </div>
    );
  }

  if (companyQuery.isError) {
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
          <div className="career-container">
            <section className="career-empty company-empty">
              <Info size={40} aria-hidden="true" />
              <h1>{dict.companyReview.loadError}</h1>
              <button
                type="button"
                className="career-button"
                onClick={() => void companyQuery.refetch()}
              >
                {dict.companyReview.retry}
              </button>
            </section>
          </div>
        </div>
        {!workspace ? <Footer /> : null}
      </div>
    );
  }

  if (companyQuery.isPending || !company || !summary) {
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
          <DossierSkeleton label={dict.companyReview.directoryLoading} />
        </div>
        {!workspace ? <Footer /> : null}
      </div>
    );
  }

  const band = summary.salaryBands[0] ?? null;
  const featured = summary.roles.find((role) => role.deadline) ?? summary.roles[0] ?? null;
  const earliestDeadline = summary.deadlines[0] ?? null;

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
        <section className="company-dossier-hero">
          <div className="career-container">
            <CompanyIndexLink className="company-dossier-hero__back">
              <ArrowLeft size={15} aria-hidden="true" />
              {dict.companyReview.backToCompanies}
            </CompanyIndexLink>

            <div className="company-dossier-hero__row">
              <div className="company-dossier-hero__identity">
                <CompanyIcon size={60} />
                <div className="min-w-0">
                  <p className="company-dossier-hero__verified">
                    <ShieldCheck size={14} aria-hidden="true" />
                    {dict.companyReview.verified}
                  </p>
                  <h1>{company.name}</h1>
                  <p className="company-dossier-hero__meta">
                    {summary.industries.length ? (
                      <span>{summary.industries.map((item) => item.label).join(" · ")}</span>
                    ) : null}
                    {summary.industries.length && summary.locations.length ? (
                      <span aria-hidden="true">·</span>
                    ) : null}
                    {summary.locations.length ? (
                      <span>{summary.locations.map((item) => item.label).join(" · ")}</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="company-dossier-hero__actions">
                <button
                  type="button"
                  className="career-button career-button--inverse"
                  onClick={() => selectTab("viec-lam")}
                >
                  {countLabel(dict.companyReview.openRolesCount, summary.roleCount)}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            <dl className="company-dossier-stats">
              <div>
                <dt>{dict.companyReview.snapshotRoles}</dt>
                <dd>{summary.roleCount}</dd>
              </div>
              <div>
                <dt>{dict.companyReview.snapshotLocations}</dt>
                <dd>{summary.locations.length}</dd>
              </div>
              <div>
                <dt>{dict.companyReview.snapshotSalary}</dt>
                <dd>{band ? compactSalary(band) : "—"}</dd>
              </div>
              <div>
                <dt>{dict.companyReview.snapshotDeadline}</dt>
                <dd>{earliestDeadline ? formatDate(earliestDeadline) : "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <nav className="company-tabs" aria-label={dict.companyReview.tabsLabel}>
          <div className="career-container company-tabs__row" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`company-tab-${item.id}`}
                aria-selected={activeTab === item.id}
                aria-controls={item.disabled ? undefined : `company-panel-${item.id}`}
                aria-disabled={item.disabled || undefined}
                className="company-tab"
                onClick={() => selectTab(item.id)}
              >
                {item.label}
                {item.disabled ? (
                  <span className="company-tab__soon">{dict.companyReview.tabSoon}</span>
                ) : null}
              </button>
            ))}
            <span className="company-tabs__count">
              {countLabel(dict.companyReview.openRolesCount, summary.roleCount)}
            </span>
          </div>
        </nav>

        <div className="career-container company-dossier-layout">
          <div className="company-dossier-main">
            {activeTab === "gioi-thieu" ? (
              <div
                id="company-panel-gioi-thieu"
                role="tabpanel"
                aria-labelledby="company-tab-gioi-thieu"
              >
                <section
                  id="company-overview"
                  className="company-block"
                  aria-labelledby="company-overview-title"
                >
                  <SectionHeading
                    id="company-overview"
                    title={dict.companyReview.generalInfo}
                    note={dict.companyReview.overviewNote}
                  />
                  <dl className="company-facts">
                    <div>
                      <dt>{dict.companyReview.industries}</dt>
                      <dd>
                        {listOrDash(
                          summary.industries.map((item) => item.label),
                          "—",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{dict.companyReview.employmentTypes}</dt>
                      <dd>
                        {listOrDash(
                          summary.employmentTypes.map((item) => item.label),
                          "—",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{dict.companyReview.workArrangements}</dt>
                      <dd>
                        {listOrDash(
                          summary.workArrangements.map((item) => item.label),
                          "—",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{dict.companyReview.workingHours}</dt>
                      <dd>{profile?.workingHours ?? dict.companyReview.notDisclosed}</dd>
                    </div>
                    <div>
                      <dt>{dict.companyReview.companyScale}</dt>
                      <dd>{profile?.companyScale ?? dict.companyReview.notDisclosed}</dd>
                    </div>
                  </dl>
                </section>

                <section
                  id="company-about"
                  className="company-block"
                  aria-labelledby="company-about-title"
                >
                  <SectionHeading
                    id="company-about"
                    title={dict.companyReview.companyLead}
                    note={dict.companyReview.companyLeadNote}
                  />
                  {profile ? (
                    <div className="company-prose">
                      {profile.introduction.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="company-block__empty">{dict.companyReview.aboutEmpty}</p>
                  )}
                </section>

                <section
                  id="company-expertise"
                  className="company-block"
                  aria-labelledby="company-expertise-title"
                >
                  <SectionHeading id="company-expertise" title={dict.companyReview.expertise} />
                  {profile?.expertise.length ? (
                    <ul className="company-expertise">
                      {profile.expertise.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="company-block__empty">{dict.companyReview.notDisclosed}</p>
                  )}
                </section>

                <section
                  id="company-headquarters"
                  className="company-block"
                  aria-labelledby="company-headquarters-title"
                >
                  <SectionHeading
                    id="company-headquarters"
                    title={dict.companyReview.headquartersTitle}
                    note={dict.companyReview.headquartersNote}
                  />
                  <p className="company-headquarters">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{profile?.headquarters ?? dict.companyReview.notDisclosed}</span>
                  </p>
                </section>
              </div>
            ) : null}

            {activeTab === "viec-lam" ? (
              <div
                id="company-panel-viec-lam"
                role="tabpanel"
                aria-labelledby="company-tab-viec-lam"
              >
                <section
                  id="company-roles"
                  className="company-block"
                  aria-labelledby="company-roles-title"
                >
                  <SectionHeading
                    id="company-roles"
                    title={dict.companyReview.openRoles}
                    note={dict.companyReview.rolesNote}
                  />
                  {summary.roles.length ? (
                    <ul className="company-roles">
                      {summary.roles.map((role) => (
                        <RoleRow key={role.id} role={role} jobsPath={jobsPath} dict={dict} />
                      ))}
                    </ul>
                  ) : (
                    <p className="company-block__empty">{dict.companyReview.noOpenRoles}</p>
                  )}
                </section>
              </div>
            ) : null}
          </div>

          <aside className="company-dossier-rail" aria-label={dict.companyReview.navLabel}>
            {featured ? (
              <section className="company-featured" aria-labelledby="company-featured-title">
                <p className="company-featured__label">{dict.companyReview.featuredTitle}</p>
                <h2 id="company-featured-title">
                  <Link to={jobsPath} search={jobSearch({ job: String(featured.id) })}>
                    {featured.title}
                  </Link>
                </h2>
                <p className="company-featured__salary">
                  {featured.salary?.label ?? dict.companyReview.roleSalaryHidden}
                </p>
                <div className="company-featured__meta">
                  <p>
                    <MapPin size={15} aria-hidden="true" />
                    <span>{featured.location ?? dict.companyReview.locations}</span>
                  </p>
                  <p>
                    <BriefcaseBusiness size={15} aria-hidden="true" />
                    <span>
                      {featured.employmentTypeLabel} · {featured.workArrangementLabel}
                    </span>
                  </p>
                  <p>
                    <CalendarClock size={15} aria-hidden="true" />
                    <span>
                      {featured.deadline
                        ? dict.companyReview.roleDeadline.replace(
                            "{date}",
                            formatDate(featured.deadline),
                          )
                        : dict.companyReview.roleNoDeadline}
                    </span>
                  </p>
                </div>
                <Link
                  to={jobsPath}
                  search={jobSearch({ job: String(featured.id) })}
                  className="career-button"
                >
                  {dict.companyReview.viewRole}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="company-featured__all"
                  onClick={() => selectTab("viec-lam")}
                >
                  {dict.companyReview.allRoles.replace("{count}", String(summary.roleCount))}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </section>
            ) : null}

            <section className="company-rail-card">
              <h2>{dict.companyReview.beforeApply}</h2>
              <p>{dict.companyReview.beforeApplyNote}</p>
              <Link to="/can/copilot" className="career-button career-button--outline">
                {dict.companyReview.askLegal}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>

            <section className="company-rail-card company-rail-card--quiet">
              <h2>{dict.companyReview.sourceTitle}</h2>
              <p>{dict.companyReview.sourceNote}</p>
              <p className="company-rail-card__demo">{dict.companyReview.mockProfileNote}</p>
            </section>
          </aside>
        </div>
      </div>

      {!workspace ? <Footer /> : null}
    </div>
  );
}
