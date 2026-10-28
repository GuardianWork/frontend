/* Hallmark · page: public job discovery · genre: modern-minimal
 * macrostructure: Catalogue · tone: utilitarian · theme: GuardianWork (DESIGN.md locked)
 * anchor hue: Guardian Blue · enrichment: none (typography + functional states)
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S5 R5 V4
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { useCandidate } from "@/context/CandidateContext";
import { buildCandidateJobs } from "@/lib/candidate-jobs";
import { JOBS, badgeLabel, isSampleListing, type JobItem } from "@/lib/job-listings";
import { paginateItems } from "@/lib/pagination";
import {
  EXPERIENCE_BANDS,
  SALARY_BANDS,
  WORK_MODES,
  WORK_MODE_LABELS,
  filterJobs,
  hasActiveFilters,
  industryOptions,
  jobSearch,
  similarJobs,
  workModeOf,
  type JobSearchParams,
} from "@/lib/job-search";

const PAGE_SIZE = 6;

const POPULAR_QUERIES = ["Kinh doanh", "Kế toán", "Tiếp thị", "Nhân sự"];

function CompanyMark({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("vi");
  return (
    <span className="career-company-mark" aria-hidden="true">
      {initials}
    </span>
  );
}

function badgeClass(job: JobItem) {
  if (job.badgeTone === "success") return "career-badge career-badge--success";
  if (job.badgeTone === "warning") return "career-badge career-badge--warning";
  return "career-badge";
}

/**
 * Public, unauthenticated job discovery (UC-CAN-07, UC-CAN-08, UC-CAN-09).
 * This is the single job search for guests and candidates: the guest catalogue is
 * the default, and entering a keyword reveals the two-column reading layout.
 */
export function PublicJobsView({ search }: { search: JobSearchParams }) {
  const navigate = useNavigate({ from: "/jobs" });
  const user = useAuthUser();
  const { isApplied } = useCandidate();
  const { workspace, company } = useCompanyWorkspace();
  const { jobs: candidateJobs } = buildCandidateJobs(workspace, company);
  // Signed-in candidates also see published company jobs; guests keep the public set.
  const jobs = user ? candidateJobs : JOBS;

  const [draftQuery, setDraftQuery] = useState(search.q ?? "");
  const [draftLocation, setDraftLocation] = useState(search.location ?? "");

  // The landing page links into this route with a fresh keyword; keep the form in sync.
  useEffect(() => setDraftQuery(search.q ?? ""), [search.q]);
  useEffect(() => setDraftLocation(search.location ?? ""), [search.location]);

  const update = (patch: JobSearchParams) => {
    void navigate({
      to: "/jobs",
      search: jobSearch({ ...search, ...patch }),
      replace: true,
      // Keep the visitor where they are: filtering must not throw them back to the hero.
      resetScroll: false,
    });
  };
  const resetFilters = () =>
    update({ q: "", location: "", industry: "", salary: "", mode: "", experience: "", page: "" });
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: draftQuery.trim(), location: draftLocation, page: "" });
  };

  const activeJob = search.job ? jobs.find((job) => job.id === search.job) : undefined;
  const jobMissing = Boolean(search.job) && !activeJob;
  const appliedFor = (jobId: string) =>
    isApplied(jobId) ||
    workspace.applications.some(
      (application) =>
        application.jobId === jobId && application.email === user?.email.toLowerCase(),
    );

  return (
    <div className="career-site">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <Header variant="landing" />
      <main id="main-content">
        {activeJob ? (
          <JobDetail
            job={activeJob}
            search={search}
            signedIn={Boolean(user)}
            applied={appliedFor(activeJob.id)}
            jobs={jobs}
          />
        ) : jobMissing ? (
          <MissingJob search={search} jobs={jobs} />
        ) : (
          <>
            <section className="career-discovery__head">
              <div className="career-container">
                <div className="career-discovery__intro">
                  <div>
                    <h1>Tìm việc làm</h1>
                    <p className="career-discovery__lede">
                      Tìm theo vị trí, kỹ năng, công ty, ngành nghề và địa điểm trên toàn quốc. Xem
                      đầy đủ mô tả, mức lương và điều kiện làm việc trước khi quyết định ứng tuyển.
                    </p>
                  </div>
                </div>

                <form className="career-search" role="search" onSubmit={submitSearch}>
                  <label className="career-search__keyword">
                    <Search size={23} aria-hidden="true" />
                    <span className="sr-only">Vị trí, kỹ năng hoặc công ty</span>
                    <input
                      value={draftQuery}
                      onChange={(event) => setDraftQuery(event.target.value)}
                      placeholder="Vị trí, kỹ năng hoặc công ty"
                    />
                  </label>
                  <label className="career-search__location">
                    <MapPin size={22} aria-hidden="true" />
                    <span className="sr-only">Địa điểm</span>
                    <select
                      value={draftLocation}
                      onChange={(event) => setDraftLocation(event.target.value)}
                    >
                      <option value="">Mọi địa điểm</option>
                      <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Bình Dương">Bình Dương</option>
                      <option value="Từ xa">Làm việc từ xa</option>
                    </select>
                  </label>
                  <button className="career-button" type="submit">
                    <Search size={19} />
                    Tìm việc ngay
                  </button>
                </form>

                <div className="career-popular">
                  <span>Tìm kiếm phổ biến:</span>
                  {POPULAR_QUERIES.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => update({ q: query, job: "", page: "" })}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <Results
              search={search}
              update={update}
              resetFilters={resetFilters}
              jobs={jobs}
              signedIn={Boolean(user)}
              applied={appliedFor}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/**
 * One listing item, shared by the guest catalogue and the two-column layout so the
 * job card reads identically in both. The title always opens the full detail page.
 */
function JobCard({
  job,
  search,
  active,
  onSelect,
}: {
  job: JobItem;
  search: JobSearchParams;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`career-job career-job--interactive${active ? " is-active" : ""}`}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
    >
      <div className="career-job__company">
        <CompanyMark name={job.company} />
        <span>{job.company}</span>
        <span className={badgeClass(job)}>{badgeLabel(job.badge)}</span>
        <ArrowRight size={18} className="career-job__arrow" aria-hidden="true" />
      </div>
      <h3>
        <Link
          to="/jobs"
          search={jobSearch({ ...search, job: job.id })}
          className="career-job__link"
          aria-label={`${job.title} — ${job.company}`}
          onClick={(event) => event.stopPropagation()}
        >
          {job.title}
        </Link>
      </h3>
      <p className="career-job__salary">{job.salaryRange}</p>
      <p className="career-job__location">
        <MapPin size={15} aria-hidden="true" />
        {job.location}
      </p>
      <div className="career-job__bottom">
        <span>
          {job.department} · {WORK_MODE_LABELS[workModeOf(job)]}
        </span>
        <span aria-hidden="true">Xem chi tiết</span>
      </div>
    </article>
  );
}

function Results({
  search,
  update,
  resetFilters,
  jobs,
  signedIn,
  applied,
}: {
  search: JobSearchParams;
  update: (patch: JobSearchParams) => void;
  resetFilters: () => void;
  jobs: JobItem[];
  signedIn: boolean;
  applied: (jobId: string) => boolean;
}) {
  const filtered = filterJobs(jobs, search);
  const requestedPage = Number.parseInt(search.page ?? "0", 10);
  const pagination = paginateItems(
    filtered,
    Number.isFinite(requestedPage) ? requestedPage : 0,
    PAGE_SIZE,
  );
  const filtersActive = hasActiveFilters(search);
  const panelFiltersActive = Boolean(
    search.industry || search.salary || search.mode || search.experience,
  );
  const industries = industryOptions(jobs);
  // The guest catalogue is the default; a keyword opens the list + detail layout,
  // and the filter panel only joins once there is a keyword to refine.
  const splitView = Boolean(search.q?.trim());
  const showFilters = splitView || panelFiltersActive;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const activeJob = splitView
    ? (pagination.items.find((job) => job.id === selectedId) ?? pagination.items[0])
    : undefined;

  const selectJob = (jobId: string) => {
    setSelectedId(jobId);
    if (!window.matchMedia("(max-width: 950px)").matches) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start", behavior }));
  };

  return (
    <section className="career-container career-discovery" aria-labelledby="results-title">
      <h2 id="results-title" className="sr-only">
        Kết quả tìm kiếm việc làm
      </h2>

      {showFilters && (
        <div className="career-discovery__filters" role="group" aria-label="Bộ lọc việc làm">
          <span className="career-discovery__filters-label">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Lọc
          </span>
          <label className="career-filter">
            <span>Ngành nghề</span>
            <select
              value={search.industry ?? ""}
              onChange={(event) => update({ industry: event.target.value, job: "", page: "" })}
            >
              <option value="">Mọi ngành nghề</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Mức lương</span>
            <select
              value={search.salary ?? ""}
              onChange={(event) => update({ salary: event.target.value, job: "", page: "" })}
            >
              {SALARY_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Hình thức</span>
            <select
              value={search.mode ?? ""}
              onChange={(event) => update({ mode: event.target.value, job: "", page: "" })}
            >
              {WORK_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Kinh nghiệm</span>
            <select
              value={search.experience ?? ""}
              onChange={(event) => update({ experience: event.target.value, job: "", page: "" })}
            >
              {EXPERIENCE_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
          {filtersActive && pagination.items.length > 0 && (
            <button type="button" className="career-filter__reset" onClick={resetFilters}>
              Xóa bộ lọc
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="career-results-meta">
        <p
          className={pagination.totalItems > 0 ? "career-results-count" : "sr-only"}
          aria-live="polite"
        >
          {pagination.totalItems} tin tuyển dụng
          {filtersActive ? " phù hợp với bộ lọc" : " đang hoạt động"}
        </p>
        {pagination.totalItems > 0 && (
          <p className="career-data-note">Huy hiệu kiểm định là dữ liệu minh họa.</p>
        )}
      </div>

      {pagination.items.length > 0 ? (
        <>
          {splitView ? (
            <div className="career-split">
              <ul className="career-split__stack" aria-label="Danh sách việc làm">
                {pagination.items.map((job) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      search={search}
                      active={job.id === activeJob?.id}
                      onSelect={() => selectJob(job.id)}
                    />
                  </li>
                ))}
              </ul>

              {activeJob && (
                <div ref={detailRef} className="career-split__detail">
                  <JobDetail
                    job={activeJob}
                    search={search}
                    signedIn={signedIn}
                    applied={applied(activeJob.id)}
                    jobs={jobs}
                    embedded
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="career-job-grid">
              {pagination.items.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  search={search}
                  onSelect={() => update({ job: job.id })}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav className="career-pagination" aria-label="Phân trang kết quả">
              <button
                type="button"
                aria-label="Trang trước"
                disabled={pagination.page === 0}
                onClick={() => update({ page: String(pagination.page - 1) })}
              >
                <span className="career-pagination__full">Trang trước</span>
                <span className="career-pagination__short" aria-hidden="true">
                  Trước
                </span>
              </button>
              <div className="career-pagination__pages">
                {Array.from({ length: pagination.totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-current={pagination.page === index ? "page" : undefined}
                    aria-label={`Trang ${index + 1}`}
                    onClick={() => update({ page: String(index) })}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Trang sau"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => update({ page: String(pagination.page + 1) })}
              >
                <span className="career-pagination__full">Trang sau</span>
                <span className="career-pagination__short" aria-hidden="true">
                  Sau
                </span>
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="career-empty">
          <SearchX size={40} aria-hidden="true" />
          <h2>Không tìm thấy tin tuyển dụng nào phù hợp</h2>
          <p>
            Thử bỏ bớt bộ lọc, chọn địa điểm rộng hơn hoặc dùng từ khóa ngắn hơn như “kế toán”,
            “kinh doanh”, “React”.
          </p>
          <div className="career-empty__actions">
            <button type="button" className="career-button" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                className="career-chip"
                onClick={() => update({ q: query, location: "", industry: "", page: "" })}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function JobDetail({
  job,
  search,
  signedIn,
  applied,
  jobs,
  embedded = false,
}: {
  job: JobItem;
  search: JobSearchParams;
  signedIn: boolean;
  applied: boolean;
  jobs: JobItem[];
  embedded?: boolean;
}) {
  const navigate = useNavigate({ from: "/jobs" });
  const similar = embedded ? [] : similarJobs(jobs, job);
  const applyHref = `/candidate/jobs/apply?job=${encodeURIComponent(job.id)}`;

  return (
    <article
      className={embedded ? "career-detail career-detail--pane" : "career-container career-detail"}
    >
      {!embedded && (
        <Link
          to="/jobs"
          search={jobSearch({ ...search, job: "", page: search.page ?? "" })}
          className="career-text-link career-back"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Danh sách việc làm
        </Link>
      )}

      <div className="career-detail__layout">
        <div className="career-detail__sheet">
          <header className="career-detail__header">
            <div className="career-detail__company">
              <CompanyMark name={job.company} />
              <div>
                <p>{job.company}</p>
                <span className={badgeClass(job)}>{badgeLabel(job.badge)}</span>
              </div>
            </div>
            <h1>{job.title}</h1>
            <ul className="career-detail__meta">
              <li>
                <Banknote size={17} aria-hidden="true" />
                <strong>{job.salaryRange}</strong>
              </li>
              <li>
                <MapPin size={17} aria-hidden="true" />
                {job.location}
              </li>
              <li>
                <BriefcaseBusiness size={17} aria-hidden="true" />
                {job.department}
              </li>
              <li>
                <CalendarClock size={17} aria-hidden="true" />
                {job.time}
              </li>
            </ul>
          </header>

          <div className="career-detail__main">
            <section aria-labelledby="detail-description">
              <h2 id="detail-description">Mô tả công việc</h2>
              <p>{job.description}</p>
            </section>

            <section aria-labelledby="detail-requirements">
              <h2 id="detail-requirements">Yêu cầu ứng viên</h2>
              {job.requirements.length ? (
                <ul>
                  {job.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              ) : (
                <p>Nhà tuyển dụng chưa công bố yêu cầu chi tiết cho vị trí này.</p>
              )}
            </section>

            <section aria-labelledby="detail-verification">
              <h2 id="detail-verification" className="career-detail__note-title">
                <ShieldCheck size={17} aria-hidden="true" />
                Ghi chú kiểm định
              </h2>
              <div className="career-detail__note">
                <p>{job.statutoryNote}</p>
                <p>{job.suggestedRevision}</p>
              </div>
            </section>
          </div>
        </div>

        <aside className="career-detail__aside">
          <div className="career-apply-card">
            <h2>Ứng tuyển vị trí này</h2>
            {signedIn ? (
              applied ? (
                <>
                  <p>Hồ sơ của bạn đã được gửi tới nhà tuyển dụng cho vị trí này.</p>
                  <span className="career-applied-state">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Đã nộp hồ sơ
                  </span>
                </>
              ) : (
                <>
                  <p>Mở hồ sơ ứng viên để chọn CV và gửi đơn cho vị trí này.</p>
                  <Link
                    to="/candidate/jobs/apply"
                    search={{ job: job.id }}
                    className="career-button"
                  >
                    Ứng tuyển ngay
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </>
              )
            ) : (
              <>
                <p>
                  Bạn cần đăng nhập để nộp hồ sơ. Việc xem tin tuyển dụng không yêu cầu tài khoản.
                </p>
                <Link
                  to="/login"
                  search={{ role: "candidate", next: applyHref }}
                  className="career-button"
                >
                  Đăng nhập để ứng tuyển
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to="/register"
                  search={{ role: "candidate" }}
                  className="career-button career-button--outline"
                >
                  Tạo tài khoản mới
                </Link>
              </>
            )}
            <p className="career-apply-card__note">
              <ShieldCheck size={16} aria-hidden="true" />
              {signedIn
                ? "Đơn ứng tuyển được gửi trực tiếp tới nhà tuyển dụng."
                : "Nộp hồ sơ chỉ dành cho ứng viên đã đăng nhập."}
            </p>
          </div>

          <div className="career-facts">
            <h2>Thông tin chung</h2>
            <dl>
              <div>
                <dt>Doanh nghiệp</dt>
                <dd>{job.company}</dd>
              </div>
              <div>
                <dt>Ngành nghề</dt>
                <dd>{job.industry ?? job.department}</dd>
              </div>
              <div>
                <dt>Hình thức</dt>
                <dd>{WORK_MODE_LABELS[workModeOf(job)]}</dd>
              </div>
              <div>
                <dt>Địa điểm</dt>
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt>Hạn nộp hồ sơ</dt>
                <dd>Chưa công bố</dd>
              </div>
              <div>
                <dt>Mã tin</dt>
                <dd>#{job.id.toUpperCase()}</dd>
              </div>
            </dl>
            <div className="career-facts__statutory">
              <Building2 size={16} aria-hidden="true" />
              <p>{job.statutoryBase}</p>
            </div>
            <p className="career-data-note">Huy hiệu kiểm định là dữ liệu minh họa.</p>
          </div>
        </aside>
      </div>

      {!embedded && similar.length > 0 && (
        <section className="career-similar" aria-labelledby="similar-title">
          <h2 id="similar-title">Việc làm tương tự</h2>
          <div className="career-job-grid">
            {similar.map((related) => (
              <JobCard
                key={related.id}
                job={related}
                search={search}
                onSelect={() =>
                  void navigate({
                    to: "/jobs",
                    search: jobSearch({ ...search, job: related.id }),
                    resetScroll: false,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function MissingJob({ search, jobs }: { search: JobSearchParams; jobs: JobItem[] }) {
  const navigate = useNavigate({ from: "/jobs" });
  const suggestions = jobs.filter((job) => !isSampleListing(job)).slice(0, 3);
  return (
    <section className="career-container career-detail">
      <Link
        to="/jobs"
        search={jobSearch({ ...search, job: "" })}
        className="career-text-link career-back"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Danh sách việc làm
      </Link>
      <div className="career-empty">
        <SearchX size={40} aria-hidden="true" />
        <h1>Tin tuyển dụng này không còn tồn tại hoặc đã hết hạn nộp hồ sơ</h1>
        <p>
          Tin có thể đã được nhà tuyển dụng đóng hoặc gỡ khỏi hệ thống. Dưới đây là việc làm khác.
        </p>
        <div className="career-empty__actions">
          <Link
            to="/jobs"
            search={jobSearch({ ...search, job: "", page: "" })}
            className="career-button"
          >
            Xem tất cả việc làm
          </Link>
        </div>
      </div>
      {suggestions.length > 0 && (
        <section className="career-similar" aria-labelledby="missing-similar-title">
          <h2 id="missing-similar-title">Việc làm khác</h2>
          <div className="career-job-grid">
            {suggestions.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                search={search}
                onSelect={() =>
                  void navigate({
                    to: "/jobs",
                    search: jobSearch({ ...search, job: job.id }),
                    resetScroll: false,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
