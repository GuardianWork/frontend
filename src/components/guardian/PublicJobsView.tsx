/* Hallmark · page: public job discovery · genre: modern-minimal
 * macrostructure: Workbench · tone: utilitarian · theme: GuardianWork (DESIGN.md locked)
 * anchor hue: Guardian Blue · enrichment: none (typography + functional states)
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S4 R5 V4
 */

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
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
import { JOBS, type JobItem } from "@/lib/job-listings";
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
const INDUSTRIES = industryOptions(JOBS);

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

/** Public, unauthenticated job discovery (UC-CAN-07, UC-CAN-08, UC-CAN-09). */
export function PublicJobsView({ search }: { search: JobSearchParams }) {
  const navigate = useNavigate({ from: "/jobs" });
  const user = useAuthUser();
  const [draftQuery, setDraftQuery] = useState(search.q ?? "");
  const [draftLocation, setDraftLocation] = useState(search.location ?? "");

  // The landing page links into this route with a fresh keyword; keep the form in sync.
  useEffect(() => setDraftQuery(search.q ?? ""), [search.q]);
  useEffect(() => setDraftLocation(search.location ?? ""), [search.location]);

  const update = (patch: JobSearchParams) => {
    void navigate({ to: "/jobs", search: jobSearch({ ...search, ...patch }), replace: true });
  };
  const resetFilters = () =>
    update({ q: "", location: "", industry: "", salary: "", mode: "", experience: "", page: "" });
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: draftQuery.trim(), location: draftLocation, page: "" });
  };

  const activeJob = search.job ? JOBS.find((job) => job.id === search.job) : undefined;
  const jobMissing = Boolean(search.job) && !activeJob;

  return (
    <div className="career-site">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <Header variant="landing" />
      <main id="main-content">
        {activeJob ? (
          <JobDetail job={activeJob} search={search} signedIn={Boolean(user)} />
        ) : jobMissing ? (
          <MissingJob search={search} />
        ) : (
          <>
            <section className="career-discovery__head">
              <div className="career-container">
                <div className="career-discovery__intro">
                  <div>
                    <h1>Tìm việc làm</h1>
                    <p>
                      Tìm theo vị trí, kỹ năng, công ty, ngành nghề và địa điểm trên toàn quốc. Xem
                      đầy đủ mô tả, mức lương và điều kiện làm việc trước khi quyết định ứng tuyển.
                    </p>
                  </div>
                  <p className="career-discovery__note">
                    <ShieldCheck size={17} />
                    Không cần đăng ký để xem tin tuyển dụng.
                  </p>
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
                      <option value="">Tất cả địa điểm</option>
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

            <Results search={search} update={update} resetFilters={resetFilters} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Results({
  search,
  update,
  resetFilters,
}: {
  search: JobSearchParams;
  update: (patch: JobSearchParams) => void;
  resetFilters: () => void;
}) {
  const filtered = filterJobs(JOBS, search);
  const requestedPage = Number.parseInt(search.page ?? "0", 10);
  const pagination = paginateItems(
    filtered,
    Number.isFinite(requestedPage) ? requestedPage : 0,
    PAGE_SIZE,
  );
  const filtersActive = hasActiveFilters(search);

  return (
    <section className="career-container career-discovery" aria-labelledby="results-title">
      <h2 id="results-title" className="sr-only">
        Kết quả tìm kiếm việc làm
      </h2>

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
            <option value="">Tất cả ngành nghề</option>
            {INDUSTRIES.map((industry) => (
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
        {filtersActive && (
          <button type="button" className="career-filter__reset" onClick={resetFilters}>
            Xóa bộ lọc
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="career-results-count" aria-live="polite">
        {pagination.totalItems} tin tuyển dụng
        {filtersActive ? " phù hợp với bộ lọc" : " đang hoạt động"}
      </p>

      {pagination.items.length > 0 ? (
        <>
          <div className="career-job-grid">
            {pagination.items.map((job) => (
              <Link
                key={job.id}
                to="/jobs"
                search={jobSearch({ ...search, job: job.id })}
                className="career-job career-job--interactive"
              >
                <div className="career-job__company">
                  <CompanyMark name={job.company} />
                  <span>{job.company}</span>
                  <span className={badgeClass(job)}>{job.badge}</span>
                  <ArrowRight size={18} className="career-job__arrow" aria-hidden="true" />
                </div>
                <h3>{job.title}</h3>
                <p className="career-job__salary">{job.salaryRange}</p>
                <p className="career-job__location">
                  <MapPin size={15} aria-hidden="true" />
                  {job.location}
                </p>
                <div className="career-job__bottom">
                  <span>
                    {job.department} · {WORK_MODE_LABELS[workModeOf(job)]}
                  </span>
                  <span>Xem chi tiết</span>
                </div>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="career-pagination" aria-label="Phân trang kết quả">
              <button
                type="button"
                disabled={pagination.page === 0}
                onClick={() => update({ page: String(pagination.page - 1) })}
              >
                Trang trước
              </button>
              <div className="career-pagination__pages">
                {Array.from({ length: pagination.totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-current={pagination.page === index ? "page" : undefined}
                    onClick={() => update({ page: String(index) })}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => update({ page: String(pagination.page + 1) })}
              >
                Trang sau
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
                className="career-filter__reset"
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
}: {
  job: JobItem;
  search: JobSearchParams;
  signedIn: boolean;
}) {
  const similar = similarJobs(JOBS, job);
  const applyHref = `/candidate/jobs?job=${encodeURIComponent(job.id)}`;

  return (
    <article className="career-container career-detail">
      <Link
        to="/jobs"
        search={jobSearch({ ...search, job: "", page: search.page ?? "" })}
        className="career-text-link career-back"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Danh sách việc làm
      </Link>

      <header className="career-detail__header">
        <div className="career-detail__company">
          <CompanyMark name={job.company} />
          <div>
            <p>{job.company}</p>
            <span className={badgeClass(job)}>{job.badge}</span>
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

      <div className="career-detail__layout">
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

          <section aria-labelledby="detail-benefits">
            <h2 id="detail-benefits">Quyền lợi &amp; điều kiện làm việc</h2>
            <p>{job.statutoryNote}</p>
          </section>

          <section aria-labelledby="detail-terms">
            <h2 id="detail-terms">Điều khoản nên xác nhận trước khi ứng tuyển</h2>
            <p>{job.suggestedRevision}</p>
          </section>
        </div>

        <aside className="career-detail__aside">
          <div className="career-apply-card">
            <h2>Ứng tuyển vị trí này</h2>
            {signedIn ? (
              <>
                <p>Mở hồ sơ ứng viên để chọn CV và gửi đơn cho vị trí này.</p>
                <Link
                  to="/candidate/jobs"
                  search={{ q: "", location: "", job: job.id }}
                  className="career-button"
                >
                  Mở hồ sơ ứng tuyển
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </>
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
              Nộp hồ sơ chỉ dành cho ứng viên đã đăng nhập.
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
          </div>
        </aside>
      </div>

      <section className="career-similar" aria-labelledby="similar-title">
        <h2 id="similar-title">Việc làm tương tự</h2>
        <div className="career-job-grid">
          {similar.map((related) => (
            <Link
              key={related.id}
              to="/jobs"
              search={jobSearch({ ...search, job: related.id })}
              className="career-job career-job--interactive"
            >
              <div className="career-job__company">
                <CompanyMark name={related.company} />
                <span>{related.company}</span>
                <ArrowRight size={18} className="career-job__arrow" aria-hidden="true" />
              </div>
              <h3>{related.title}</h3>
              <p className="career-job__salary">{related.salaryRange}</p>
              <p className="career-job__location">
                <MapPin size={15} aria-hidden="true" />
                {related.location}
              </p>
              <div className="career-job__bottom">
                <span>{related.department}</span>
                <span>Xem chi tiết</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}

function MissingJob({ search }: { search: JobSearchParams }) {
  const suggestions = JOBS.slice(0, 3);
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
      <section className="career-similar" aria-labelledby="missing-similar-title">
        <h2 id="missing-similar-title">Việc làm tương tự</h2>
        <div className="career-job-grid">
          {suggestions.map((job) => (
            <Link
              key={job.id}
              to="/jobs"
              search={jobSearch({ ...search, job: job.id })}
              className="career-job career-job--interactive"
            >
              <div className="career-job__company">
                <CompanyMark name={job.company} />
                <span>{job.company}</span>
                <ArrowRight size={18} className="career-job__arrow" aria-hidden="true" />
              </div>
              <h3>{job.title}</h3>
              <p className="career-job__salary">{job.salaryRange}</p>
              <p className="career-job__location">
                <MapPin size={15} aria-hidden="true" />
                {job.location}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
