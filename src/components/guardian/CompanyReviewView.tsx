import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import {
  compactSalary,
  companyIntroduction,
  findPublicCompany,
  payPeriodLabel,
  readCompanySummary,
  salaryBandLabel,
  type CompanyRole,
  type CompanySalaryBand,
  type CompanySummary,
} from "@/services/publicCompanies";
import { jobSearch } from "@/lib/job-search";
import { CompanyIndexLink } from "./CompanyLinks";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CompanyMark, useJobsPath } from "./PublicJobsView";

const SECTION_IDS = [
  "company-overview",
  "company-about",
  "company-hiring",
  "company-roles",
  "company-locations",
  "company-source",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

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

function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  const key = ids.join("|");
  useEffect(() => {
    if (!ids.length) return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-24% 0px -58% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // The joined ids are the stable identity of this observation set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="company-block__head">
      <h2 id={`${id}-title`}>{title}</h2>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

function PayChart({
  summary,
  band,
  dict,
}: {
  summary: CompanySummary;
  band: CompanySalaryBand;
  dict: ReturnType<typeof useLanguage>["dict"];
}) {
  const span = Math.max(0, band.maximum - band.minimum);
  const matches = (role: CompanyRole) =>
    Boolean(
      role.salary &&
      role.salary.currency === band.currency &&
      role.salary.payPeriod === band.payPeriod,
    );
  const rows = [...summary.roles].sort((a, b) => {
    const aMatch = matches(a);
    const bMatch = matches(b);
    if (aMatch && bMatch) return a.salary!.minimum - b.salary!.minimum || a.id - b.id;
    if (aMatch) return -1;
    if (bMatch) return 1;
    return a.id - b.id;
  });

  return (
    <div className="company-pay">
      <div className="company-pay__head">
        <h3>{dict.companyReview.salaryChartTitle}</h3>
        <p>
          {dict.companyReview.salaryTransparencyValue
            .replace("{disclosed}", String(summary.disclosedSalaryCount))
            .replace("{total}", String(summary.roleCount))}
        </p>
      </div>
      <p className="company-pay__band">{salaryBandLabel(band)}</p>
      <ul className="company-pay__rows">
        {rows.map((role) => {
          const inBand = matches(role);
          const left = inBand && span ? ((role.salary!.minimum - band.minimum) / span) * 100 : 0;
          const width =
            inBand && span
              ? Math.min(
                  Math.max(((role.salary!.maximum - role.salary!.minimum) / span) * 100, 4),
                  100 - left,
                )
              : 100;
          return (
            <li
              key={role.id}
              className={`company-pay__row${inBand ? "" : " company-pay__row--muted"}`}
            >
              <span className="company-pay__role" title={role.title}>
                {role.title}
              </span>
              <span className="company-pay__track" aria-hidden="true">
                {inBand ? (
                  <span
                    className="company-pay__bar"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                ) : null}
              </span>
              <span className="company-pay__value">
                {role.salary ? role.salary.label : dict.companyReview.roleSalaryHidden}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="company-pay__note">
        {dict.companyReview.salaryChartNote.replace(
          "{unit}",
          `${band.currency}/${payPeriodLabel(band.payPeriod)}`,
        )}
      </p>
      {summary.salaryBands.length > 1 ? (
        <p className="company-pay__note">
          {dict.companyReview.salaryOtherBands.replace(
            "{bands}",
            summary.salaryBands.slice(1).map(salaryBandLabel).join(" · "),
          )}
        </p>
      ) : null}
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
  workspace = false,
}: {
  companyId: number;
  workspace?: boolean;
}) {
  const { dict } = useLanguage();
  const jobsPath = useJobsPath();
  const companyQuery = useQuery({
    queryKey: ["public-company", companyId],
    queryFn: () => findPublicCompany(companyId),
    enabled: companyId > 0,
    staleTime: 60_000,
  });

  const company = companyQuery.data ?? null;
  const summary = useMemo(() => (company ? readCompanySummary(company) : null), [company]);
  const introduction = useMemo(() => (company ? companyIntroduction(company) : null), [company]);
  const activeSection = useActiveSection(company ? SECTION_IDS : []);

  const navItems: { id: SectionId; label: string }[] = [
    { id: "company-overview", label: dict.companyReview.navOverview },
    { id: "company-about", label: dict.companyReview.navAbout },
    { id: "company-hiring", label: dict.companyReview.navHiring },
    { id: "company-roles", label: dict.companyReview.navRoles },
    { id: "company-locations", label: dict.companyReview.navLocations },
    { id: "company-source", label: dict.companyReview.navSource },
  ];

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
                <CompanyMark name={company.name} />
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
                <a className="career-button career-button--inverse" href="#company-roles">
                  {countLabel(dict.companyReview.openRolesCount, summary.roleCount)}
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
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

        <nav className="company-section-nav" aria-label={dict.companyReview.navLabel}>
          <div className="career-container company-section-nav__row">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "location" : undefined}
              >
                {item.label}
              </a>
            ))}
            <span className="company-section-nav__count">
              {countLabel(dict.companyReview.openRolesCount, summary.roleCount)}
            </span>
          </div>
        </nav>

        <div className="career-container company-dossier-layout">
          <div className="company-dossier-main">
            <section
              id="company-overview"
              className="company-block"
              aria-labelledby="company-overview-title"
            >
              <SectionHeading
                id="company-overview"
                title={dict.companyReview.employmentTerms}
                note={dict.companyReview.overviewNote.replace("{count}", String(summary.roleCount))}
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
                  <dt>{dict.companyReview.locations}</dt>
                  <dd>
                    {listOrDash(
                      summary.locations.map((item) => item.label),
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
                  <dt>{dict.companyReview.salary}</dt>
                  <dd>{band ? salaryBandLabel(band) : dict.companyReview.salaryHidden}</dd>
                </div>
                <div>
                  <dt>{dict.companyReview.deadlines}</dt>
                  <dd>
                    {summary.deadlines.length
                      ? summary.deadlines.map(formatDate).join(" · ")
                      : dict.companyReview.deadlineNone}
                  </dd>
                </div>
                {summary.headcountTotal ? (
                  <div>
                    <dt>{dict.companyReview.headcount}</dt>
                    <dd>{countLabel(dict.companyReview.roleHeadcount, summary.headcountTotal)}</dd>
                  </div>
                ) : null}
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
              {introduction ? (
                <div className="company-prose">
                  {introduction.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  <p className="company-prose__source">
                    <Link to={jobsPath} search={jobSearch({ job: String(introduction.jobId) })}>
                      {dict.companyReview.aboutSource.replace("{title}", introduction.roleTitle)}
                    </Link>
                    <ArrowRight size={14} aria-hidden="true" />
                  </p>
                </div>
              ) : (
                <p className="company-block__empty">{dict.companyReview.aboutEmpty}</p>
              )}
            </section>

            <section
              id="company-hiring"
              className="company-block"
              aria-labelledby="company-hiring-title"
            >
              <SectionHeading
                id="company-hiring"
                title={dict.companyReview.hiringTitle}
                note={dict.companyReview.hiringNote}
              />
              <div className="company-hiring">
                {band ? (
                  <PayChart summary={summary} band={band} dict={dict} />
                ) : (
                  <div className="company-pay">
                    <h3>{dict.companyReview.salaryChartTitle}</h3>
                    <p className="company-block__empty">{dict.companyReview.salaryChartEmpty}</p>
                  </div>
                )}
                <div className="company-shape">
                  <h3>{dict.companyReview.workingShapeTitle}</h3>
                  <dl>
                    <div>
                      <dt>{dict.companyReview.employmentTypes}</dt>
                      {summary.employmentTypes.map((item) => (
                        <dd key={item.label}>
                          <span>{item.label}</span>
                          <span className="company-shape__count">{item.count}</span>
                        </dd>
                      ))}
                    </div>
                    <div>
                      <dt>{dict.companyReview.workArrangements}</dt>
                      {summary.workArrangements.map((item) => (
                        <dd key={item.label}>
                          <span>{item.label}</span>
                          <span className="company-shape__count">{item.count}</span>
                        </dd>
                      ))}
                    </div>
                  </dl>
                </div>
              </div>
            </section>

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

            <section
              id="company-locations"
              className="company-block"
              aria-labelledby="company-locations-title"
            >
              <SectionHeading
                id="company-locations"
                title={dict.companyReview.locationsTitle}
                note={dict.companyReview.locationsNote}
              />
              <ul className="company-locations">
                {summary.locations.map((location) => (
                  <li key={location.label} className="company-location">
                    <div className="company-location__head">
                      <MapPin size={16} aria-hidden="true" />
                      <span>{location.label}</span>
                      <span className="company-location__count">
                        {countLabel(dict.companyReview.locationRolesCount, location.count)}
                      </span>
                    </div>
                    <ul className="company-location__roles">
                      {summary.roles
                        .filter((role) => role.location === location.label)
                        .map((role) => (
                          <li key={role.id}>
                            <Link to={jobsPath} search={jobSearch({ job: String(role.id) })}>
                              {role.title}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="company-block__note">{dict.companyReview.locationsMapNote}</p>
            </section>

            <section
              id="company-source"
              className="company-block"
              aria-labelledby="company-source-title"
            >
              <SectionHeading
                id="company-source"
                title={dict.companyReview.sourceTitle}
                note={dict.companyReview.sourceIntro}
              />
              <ul className="company-source-list">
                <li>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>{dict.companyReview.sourceIdentity}</span>
                </li>
                <li>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <span>{dict.companyReview.sourceVerification}</span>
                </li>
                <li>
                  <RefreshCw size={18} aria-hidden="true" />
                  <span>{dict.companyReview.sourceAggregated}</span>
                </li>
                <li>
                  <Info size={18} aria-hidden="true" />
                  <span>{dict.companyReview.sourceMissing}</span>
                </li>
              </ul>
            </section>
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
                <a href="#company-roles" className="company-featured__all">
                  {dict.companyReview.allRoles.replace("{count}", String(summary.roleCount))}
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
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
              <a href="#company-source" className="career-text-link">
                {dict.companyReview.sourceSectionLink}
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </section>
          </aside>
        </div>
      </div>

      {!workspace ? <Footer /> : null}
    </div>
  );
}
